use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use serde::Deserialize;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::crypto::argon::hash_password;
use crate::db::admins::*;
use crate::db::audit;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateAdminBody {
    pub email: String, pub password: String,
    pub display_name: Option<String>, pub role: Option<String>,
}

#[derive(Deserialize)]
pub struct ChangePasswordBody { pub new_password: String }

pub async fn list_admins_handler(state: web::Data<AppState>) -> HttpResponse {
    match list_admins(&state.db).await {
        Ok(admins) => {
            let safe: Vec<_> = admins.iter().map(|a| serde_json::json!({
                "id": a.id, "email": a.email, "display_name": a.display_name,
                "role": a.role, "is_2fa_enabled": a.is_2fa_enabled,
                "is_active": a.is_active, "last_login_at": a.last_login_at,
            })).collect();
            HttpResponse::Ok().json(serde_json::json!({"data": safe}))
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub async fn create_admin_handler(req: HttpRequest, state: web::Data<AppState>, body: web::Json<CreateAdminBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    if auth.role != "superadmin" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Only superadmin can create admins"}));
    }
    let hash = match hash_password(&body.password) {
        Ok(h) => h, Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Password hash failed"})),
    };
    let role = body.role.clone().unwrap_or_else(|| "admin".to_string());
    match create_admin(&state.db, &body.email, &hash, body.display_name.as_deref(), &role).await {
        Ok(admin) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "admin.create", Some("admin"), Some(&admin.id.to_string()), None, None, None, None).await;
            HttpResponse::Created().json(serde_json::json!({"id": admin.id, "email": admin.email, "role": admin.role}))
        },
        Err(e) => { tracing::error!("Create admin failed: {}", e); HttpResponse::InternalServerError().json(serde_json::json!({"error": "Create failed"})) }
    }
}

pub async fn setup_2fa(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let secret = match crate::crypto::totp::generate_totp_secret() {
        Ok(s) => s, Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "TOTP gen failed"})),
    };
    let admin = match get_admin_by_id(&state.db, auth.admin_id).await {
        Ok(Some(a)) => a, _ => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Admin not found"})),
    };
    let qr_url = crate::crypto::totp::generate_qr_code_svg(&secret, &admin.email).unwrap_or_default();
    let backup_codes = crate::crypto::totp::generate_backup_codes();
    let encrypted_secret = crate::crypto::aes::encrypt(&state.config.master_key, &secret).unwrap_or_default();
    let _ = set_totp_secret(&state.db, auth.admin_id, encrypted_secret.as_bytes(), &backup_codes).await;
    HttpResponse::Ok().json(serde_json::json!({
        "otpauth_url": qr_url, "backup_codes": backup_codes,
        "warning": "Scan the QR code and save backup codes securely."
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/admins")
            .route("", web::get().to(list_admins_handler))
            .route("", web::post().to(create_admin_handler))
            .route("/me/2fa/setup", web::post().to(setup_2fa))
    );
}
