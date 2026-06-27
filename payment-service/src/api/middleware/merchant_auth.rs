use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    web, Error, HttpMessage,
};
use futures_util::future::{ready, LocalBoxFuture, Ready};
use sha2::{Digest, Sha256};
use std::rc::Rc;
use uuid::Uuid;

use crate::db::merchants::{get_valid_merchant_session, get_merchant_by_id};
use crate::AppState;

/// Data attached to request after successful merchant session auth
#[derive(Debug, Clone)]
pub struct AuthenticatedMerchant {
    pub merchant_user_id: Uuid,
    pub service_id: Uuid,
    pub role: String,
}

pub struct MerchantAuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for MerchantAuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = MerchantAuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(MerchantAuthMiddlewareService { service: Rc::new(service) }))
    }
}

pub struct MerchantAuthMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for MerchantAuthMiddlewareService<S>
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
            // Extract bearer token from Authorization header
            let token = req.headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.strip_prefix("Bearer "))
                .ok_or_else(|| ErrorUnauthorized("Missing or invalid Authorization header"))?
                .to_string();

            // Hash the token for DB lookup
            let token_hash = hex::encode(Sha256::digest(token.as_bytes()));

            let state = req.app_data::<web::Data<AppState>>()
                .ok_or_else(|| ErrorUnauthorized("Server error"))?;

            let merchant_user_id = get_valid_merchant_session(&state.db, &token_hash)
                .await
                .map_err(|_| ErrorUnauthorized("Session lookup failed"))?
                .ok_or_else(|| ErrorUnauthorized("Invalid or expired session"))?;

            // Get merchant user for role and service_id
            let merchant = get_merchant_by_id(&state.db, merchant_user_id)
                .await
                .map_err(|_| ErrorUnauthorized("Merchant lookup failed"))?
                .ok_or_else(|| ErrorUnauthorized("Merchant not found"))?;

            if !merchant.is_active {
                return Err(ErrorUnauthorized("Merchant account is deactivated"));
            }

            req.extensions_mut().insert(AuthenticatedMerchant {
                merchant_user_id: merchant.id,
                service_id: merchant.service_id,
                role: merchant.role,
            });

            svc.call(req).await
        })
    }
}
