use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::crypto::argon::verify_password;
use crate::crypto::totp::verify_code;
use crate::db::admins::*;
use crate::db::config::get_config_int;
use crate::api::middleware::rate_limit::extract_ip;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct TotpVerifyRequest {
    pub code: String,
    pub temp_token: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub requires_2fa: bool,
    pub temp_token: Option<String>,
    pub session_token: Option<String>,
    pub admin_id: String,
    pub role: String,
}

/// POST /api/admin/auth/login
pub async fn login(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<LoginRequest>,
) -> HttpResponse {
    let ip = extract_ip(&req);

    // Rate limit: 5 attempts per minute per IP
    let mut redis = state.redis.lock().await;
    let rate_key = format!("rate:login:{}", ip);
    let allowed = crate::cache::rate_limit_check(&mut redis, &rate_key, 60, 5)
        .await
        .unwrap_or(true);
    drop(redis);

    if !allowed {
        return HttpResponse::TooManyRequests().json(serde_json::json!({
            "error": "Too many login attempts. Please wait."
        }));
    }

    let admin = match get_admin_by_email(&state.db, &body.email).await {
        Ok(Some(a)) => a,
        Ok(None) => {
            // Don't leak whether email exists
            return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid credentials"}));
        }
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };

    // Check lockout
    if let Some(locked_until) = admin.locked_until {
        if locked_until > chrono::Utc::now() {
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Account temporarily locked due to failed login attempts"
            }));
        }
    }

    // Verify password
    let max_attempts = get_config_int(&state.db, "security", "max_login_attempts", 5).await.unwrap_or(5) as i16;
    let lockout_minutes = get_config_int(&state.db, "security", "lockout_minutes", 30).await.unwrap_or(30);

    let password_ok = verify_password(&body.password, &admin.password_hash).unwrap_or(false);
    if !password_ok {
        let _ = increment_failed_login(&state.db, admin.id, max_attempts, lockout_minutes).await;
        return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid credentials"}));
    }

    // Reset failed login count on success
    let _ = reset_failed_login(&state.db, admin.id, &ip).await;

    // If 2FA enabled, issue temp token and require TOTP
    if admin.is_2fa_enabled {
        // Store temp token in Redis (valid 5 minutes)
        let temp_token = crate::crypto::hmac::generate_service_secret();
        let temp_key = format!("2fa_temp:{}", temp_token);
        let mut redis = state.redis.lock().await;
        let _: () = redis::AsyncCommands::set_ex(&mut *redis, &temp_key, admin.id.to_string(), 300u64)
            .await
            .unwrap_or(());
        drop(redis);

        return HttpResponse::Ok().json(LoginResponse {
            requires_2fa: true,
            temp_token: Some(temp_token),
            session_token: None,
            admin_id: admin.id.to_string(),
            role: admin.role,
        });
    }

    // No 2FA — issue session directly
    let session_hours = get_config_int(&state.db, "security", "admin_session_hours", 8).await.unwrap_or(8);
    let session_token = crate::crypto::hmac::generate_service_secret();
    let token_hash = hex::encode(Sha256::digest(session_token.as_bytes()));
    let ua = req.headers().get("User-Agent").and_then(|v| v.to_str().ok()).map(String::from);

    match create_session(&state.db, admin.id, &token_hash, Some(&ip), ua.as_deref(), session_hours).await {
        Ok(_) => {},
        Err(e) => {
            tracing::error!("Failed to create admin session: {:?}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to create session"}));
        }
    }

    let _ = crate::db::audit::log(&state.db, "admin", Some(&admin.id.to_string()), "admin.login",
        None, None, None, None, Some(&ip), ua.as_deref()).await;

    HttpResponse::Ok().json(LoginResponse {
        requires_2fa: false,
        temp_token: None,
        session_token: Some(session_token),
        admin_id: admin.id.to_string(),
        role: admin.role,
    })
}

/// POST /api/admin/auth/2fa/verify
pub async fn verify_2fa(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<TotpVerifyRequest>,
) -> HttpResponse {
    let ip = extract_ip(&req);
    let ua = req.headers().get("User-Agent").and_then(|v| v.to_str().ok()).map(String::from);

    // Lookup temp token from Redis
    let temp_key = format!("2fa_temp:{}", body.temp_token);
    let mut redis = state.redis.lock().await;
    let admin_id_str: Option<String> = redis::AsyncCommands::get(&mut *redis, &temp_key).await.unwrap_or(None);
    drop(redis);

    let admin_id_str = match admin_id_str {
        Some(s) => s,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid or expired 2FA session"})),
    };

    let admin_id = match uuid::Uuid::parse_str(&admin_id_str) {
        Ok(id) => id,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };

    let admin = match get_admin_by_id(&state.db, admin_id).await {
        Ok(Some(a)) => a,
        _ => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Admin not found"})),
    };

    // Decrypt TOTP secret
    // totp_secret_encrypted is stored as UTF-8 bytes of a hex string (see admins.rs setup_2fa)
    let totp_secret = if let Some(encrypted) = &admin.totp_secret_encrypted {
        let encrypted_hex = match String::from_utf8(encrypted.clone()) {
            Ok(s) => s,
            Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Invalid TOTP format"})),
        };
        match crate::crypto::aes::decrypt(&state.config.master_key, &encrypted_hex) {
            Ok(s) => s,
            Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "TOTP decrypt failed"})),
        }
    } else {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "2FA not configured"}));
    };

    // Verify code
    let code_valid = verify_code(&totp_secret, &body.code).unwrap_or(false);

    // Try backup code if TOTP fails
    if !code_valid {
        let backup_ok = use_backup_code(&state.db, admin_id, &body.code).await.unwrap_or(false);
        if !backup_ok {
            return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Invalid 2FA code"}));
        }
    }

    // Issue session
    let session_hours = get_config_int(&state.db, "security", "admin_session_hours", 8).await.unwrap_or(8);
    let session_token = crate::crypto::hmac::generate_service_secret();
    let token_hash = hex::encode(Sha256::digest(session_token.as_bytes()));

    let _ = create_session(&state.db, admin_id, &token_hash, Some(&ip), ua.as_deref(), session_hours).await;

    // Delete temp token
    let mut redis = state.redis.lock().await;
    let _: () = redis::AsyncCommands::del(&mut *redis, &temp_key).await.unwrap_or(());
    drop(redis);

    let _ = crate::db::audit::log(&state.db, "admin", Some(&admin_id.to_string()), "admin.login_2fa",
        None, None, None, None, Some(&ip), ua.as_deref()).await;

    HttpResponse::Ok().json(serde_json::json!({
        "session_token": session_token,
        "admin_id": admin_id,
        "role": admin.role,
    }))
}

/// POST /api/admin/auth/logout
pub async fn logout(state: web::Data<AppState>, req: HttpRequest) -> HttpResponse {
    if let Some(token) = req.headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
    {
        let token_hash = hex::encode(Sha256::digest(token.as_bytes()));
        let _ = revoke_session(&state.db, &token_hash).await;
    }
    HttpResponse::Ok().json(serde_json::json!({"success": true}))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/login", web::post().to(login))
            .route("/2fa/verify", web::post().to(verify_2fa))
            .route("/logout", web::post().to(logout))
    );
}
