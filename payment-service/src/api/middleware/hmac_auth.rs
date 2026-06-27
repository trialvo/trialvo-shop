use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    web, Error, HttpMessage,
};
use futures_util::future::{ready, LocalBoxFuture, Ready};
use std::rc::Rc;
use uuid::Uuid;
use chrono::Utc;

use crate::crypto::hmac::{hash_key_for_lookup, verify_service_signature};
use crate::db::services::{find_key_by_hash, update_key_last_used, get_service_by_id};
use crate::cache::store_nonce;
use crate::AppState;

/// Data attached to request after successful HMAC auth
#[derive(Debug, Clone)]
pub struct AuthenticatedService {
    pub service_id: Uuid,
    pub key_id: Uuid,
    pub is_sandbox: bool,
}

pub struct HmacAuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for HmacAuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = HmacAuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(HmacAuthMiddlewareService { service: Rc::new(service) }))
    }
}

pub struct HmacAuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for HmacAuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            // Extract required headers
            let service_id_str = req.headers()
                .get("X-Service-Id")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| ErrorUnauthorized("Missing X-Service-Id header"))?
                .to_string();

            let timestamp_str = req.headers()
                .get("X-Timestamp")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| ErrorUnauthorized("Missing X-Timestamp header"))?
                .to_string();

            let nonce = req.headers()
                .get("X-Nonce")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| ErrorUnauthorized("Missing X-Nonce header"))?
                .to_string();

            let signature = req.headers()
                .get("X-Signature")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| ErrorUnauthorized("Missing X-Signature header"))?
                .to_string();

            let api_key = req.headers()
                .get("X-Api-Key")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| ErrorUnauthorized("Missing X-Api-Key header"))?
                .to_string();

            // Validate timestamp (replay window: 300s)
            let timestamp: u64 = timestamp_str.parse()
                .map_err(|_| ErrorUnauthorized("Invalid X-Timestamp"))?;
            let now = Utc::now().timestamp() as u64;
            if now.saturating_sub(timestamp) > 300 || timestamp.saturating_sub(now) > 60 {
                return Err(ErrorUnauthorized("Request timestamp expired"));
            }

            let state = req.app_data::<web::Data<AppState>>()
                .ok_or_else(|| ErrorUnauthorized("Server error: no state"))?;

            // Look up key by hash
            let key_hash = hash_key_for_lookup(&api_key);
            let service_key = find_key_by_hash(&state.db, &key_hash)
                .await
                .map_err(|_| ErrorUnauthorized("Auth lookup failed"))?
                .ok_or_else(|| ErrorUnauthorized("Invalid API key"))?;

            // Check grace period expiry
            if let Some(grace_until) = service_key.grace_until {
                if grace_until < Utc::now() {
                    return Err(ErrorUnauthorized("API key has expired (past grace period)"));
                }
            }

            // Get service
            let service = get_service_by_id(&state.db, service_key.service_id)
                .await
                .map_err(|_| ErrorUnauthorized("Service lookup failed"))?
                .ok_or_else(|| ErrorUnauthorized("Service not found"))?;

            if !service.is_active {
                return Err(ErrorUnauthorized("Service is deactivated"));
            }

            // Validate service_id header matches key's service
            let claimed_service_id = Uuid::parse_str(&service_id_str)
                .map_err(|_| ErrorUnauthorized("Invalid X-Service-Id format"))?;
            if claimed_service_id != service.id {
                return Err(ErrorUnauthorized("Service ID mismatch"));
            }

            // Check nonce (replay protection)
            let nonce_ttl = 600u64;
            let redis = state.redis.clone();
            let nonce_ok = store_nonce(
                &mut redis.lock().await.clone(),
                &nonce,
                &service.id.to_string(),
                nonce_ttl,
            )
            .await
            .map_err(|_| ErrorUnauthorized("Nonce check failed"))?;

            if !nonce_ok {
                return Err(ErrorUnauthorized("Nonce already used (replay attack)"));
            }

            // Get actual secret from encrypted_key
            // encrypted_key is stored as UTF-8 bytes of a hex string (see services.rs generate_key)
            let encrypted_hex = String::from_utf8(service_key.encrypted_key.clone())
                .map_err(|_| ErrorUnauthorized("Invalid key format"))?;
            let decrypted_key = crate::crypto::aes::decrypt(
                &state.config.master_key,
                &encrypted_hex,
            )
            .map_err(|_| ErrorUnauthorized("Key decryption failed"))?;

            // Validate HMAC signature (body_sha256 from X-Body-Hash header, or empty if no body)
            let body_hash = req.headers()
                .get("X-Body-Hash")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"); // SHA256("")

            let valid = verify_service_signature(
                decrypted_key.as_bytes(),
                &service.id.to_string(),
                timestamp,
                &nonce,
                body_hash,
                &signature,
            );

            if !valid {
                return Err(ErrorUnauthorized("Invalid HMAC signature"));
            }

            // Update last_used_at
            let _ = update_key_last_used(&state.db, service_key.id).await;

            // ── Per-service rate limit (100 req/min default) ───────────────
            let rate_limit = crate::db::config::get_config_int(
                &state.db, "general", "api_rate_limit_per_min", 100
            ).await.unwrap_or(100) as u64;

            let rate_key = crate::api::middleware::rate_limit::rate_key_api(&service.id.to_string());
            let mut redis = state.redis.lock().await;
            let rate_ok = crate::cache::rate_limit_check(&mut redis, &rate_key, 60, rate_limit)
                .await
                .unwrap_or(true);
            drop(redis);

            if !rate_ok {
                return Err(actix_web::error::ErrorTooManyRequests("API rate limit exceeded. Max 100 requests per minute."));
            }

            // Attach auth context to request
            req.extensions_mut().insert(AuthenticatedService {
                service_id: service.id,
                key_id: service_key.id,
                is_sandbox: service.is_sandbox,
            });

            svc.call(req).await
        })
    }
}
