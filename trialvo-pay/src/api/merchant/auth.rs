use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{Duration, Utc};
use serde::Deserialize;
use sha2::{Digest, Sha256};

use crate::api::middleware::rate_limit::extract_ip;
use crate::crypto::argon::{hash_password, verify_password};
use crate::db::merchants::*;
use crate::db::config::get_config_int;
use crate::db::audit;
use crate::AppState;

use super::super::middleware::merchant_auth::AuthenticatedMerchant;
use actix_web::HttpMessage;

#[derive(Deserialize)]
pub struct LoginBody {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct ChangePasswordBody {
    pub current_password: String,
    pub new_password: String,
}

pub async fn login(req: HttpRequest, state: web::Data<AppState>, body: web::Json<LoginBody>) -> HttpResponse {
    let ip = extract_ip(&req);

    // ── Rate limit: 5 attempts per minute per IP ───────────────────────────
    let mut redis = state.redis.lock().await;
    let rate_key = format!("rate:merchant_login:{}", ip);
    let allowed = crate::cache::rate_limit_check(&mut redis, &rate_key, 60, 5)
        .await
        .unwrap_or(true);
    drop(redis);

    if !allowed {
        return HttpResponse::TooManyRequests().json(serde_json::json!({
            "error": "Too many login attempts. Please wait before trying again."
        }));
    }

    // ── Find merchant by email ─────────────────────────────────────────────
    let merchant = match get_merchant_by_email(&state.db, &body.email).await {
        Ok(Some(m)) => m,
        _ => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid email or password"})),
    };

    // ── Check if account is deactivated ───────────────────────────────────
    if !merchant.is_active {
        return HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Account is deactivated. Contact your Trialvo Pay admin."
        }));
    }

    // ── Check account lockout ──────────────────────────────────────────────
    if let Some(locked_until) = merchant.locked_until {
        if locked_until > Utc::now() {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Account temporarily locked due to too many failed login attempts. Please try again later."
            }));
        }
    }

    // ── Read security config ───────────────────────────────────────────────
    let max_attempts = get_config_int(&state.db, "security", "max_login_attempts", 5)
        .await.unwrap_or(5) as i16;
    let lockout_minutes = get_config_int(&state.db, "security", "lockout_minutes", 30)
        .await.unwrap_or(30);

    // ── Verify password ────────────────────────────────────────────────────
    match verify_password(&body.password, &merchant.password_hash) {
        Ok(true) => {}
        _ => {
            let _ = increment_failed_merchant_login(&state.db, merchant.id, max_attempts, lockout_minutes).await;
            return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid email or password"}));
        }
    }

    // ── Reset failed login on success ──────────────────────────────────────
    let _ = reset_failed_merchant_login(&state.db, merchant.id).await;

    // ── Generate session token ─────────────────────────────────────────────
    let raw_token = uuid::Uuid::new_v4().to_string();
    let token_hash = hex::encode(Sha256::digest(raw_token.as_bytes()));
    let expires_at = Utc::now() + Duration::hours(12);
    let ua = req.headers().get("User-Agent").and_then(|v| v.to_str().ok());

    match create_merchant_session(&state.db, merchant.id, &token_hash, Some(&ip), ua, expires_at).await {
        Ok(_) => {}
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Session creation failed"})),
    }

    let _ = update_merchant_login(&state.db, merchant.id, Some(&ip)).await;
    let _ = audit::log(&state.db, "merchant", Some(&merchant.id.to_string()), "merchant.login", None, None, None, None, Some(&ip), ua).await;

    HttpResponse::Ok().json(serde_json::json!({
        "token": raw_token,
        "merchant": {
            "id": merchant.id,
            "email": merchant.email,
            "display_name": merchant.display_name,
            "service_id": merchant.service_id,
            "role": merchant.role,
            "must_change_password": merchant.must_change_password,
        },
        "expires_at": expires_at.to_rfc3339(),
    }))
}

pub async fn logout(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let token = req.headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .unwrap_or("");
    let token_hash = hex::encode(Sha256::digest(token.as_bytes()));
    let _ = revoke_merchant_session(&state.db, &token_hash).await;
    HttpResponse::Ok().json(serde_json::json!({"success": true}))
}

pub async fn change_password(req: HttpRequest, state: web::Data<AppState>, body: web::Json<ChangePasswordBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    let merchant = match get_merchant_by_id(&state.db, auth.merchant_user_id).await {
        Ok(Some(m)) => m,
        _ => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Merchant not found"})),
    };

    match verify_password(&body.current_password, &merchant.password_hash) {
        Ok(true) => {},
        _ => return HttpResponse::BadRequest().json(serde_json::json!({"error": "Current password is incorrect"})),
    }

    if body.new_password.len() < 8 {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Password must be at least 8 characters"}));
    }

    let new_hash = match hash_password(&body.new_password) {
        Ok(h) => h,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Password hash failed"})),
    };

    let _ = update_merchant_password(&state.db, merchant.id, &new_hash).await;
    let _ = audit::log(&state.db, "merchant", Some(&merchant.id.to_string()), "merchant.password_changed", None, None, None, None, None, None).await;

    HttpResponse::Ok().json(serde_json::json!({"success": true, "message": "Password changed successfully"}))
}

pub async fn me(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let merchant = match get_merchant_by_id(&state.db, auth.merchant_user_id).await {
        Ok(Some(m)) => m,
        _ => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Merchant not found"})),
    };
    HttpResponse::Ok().json(serde_json::json!({
        "id": merchant.id,
        "email": merchant.email,
        "display_name": merchant.display_name,
        "service_id": merchant.service_id,
        "role": merchant.role,
        "must_change_password": merchant.must_change_password,
        "last_login_at": merchant.last_login_at,
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout))
    );
}

/// Protected auth routes (need middleware)
pub fn protected_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/auth/me", web::get().to(me))
       .route("/auth/change-password", web::post().to(change_password));
}
