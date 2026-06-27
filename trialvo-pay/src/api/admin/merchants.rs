use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::crypto::argon::hash_password;
use crate::db::merchants::*;
use crate::db::audit;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateMerchantBody {
    pub service_id: Uuid,
    pub email: String,
    pub password: String,
    pub display_name: Option<String>,
}

#[derive(Deserialize)]
pub struct ResetPasswordBody {
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct UpdateCommissionBody {
    pub commission_rate: bigdecimal::BigDecimal,
    pub commission_type: Option<String>,
}

pub async fn list(state: web::Data<AppState>) -> HttpResponse {
    match list_merchant_users(&state.db, 200, 0).await {
        Ok(merchants) => {
            let data: Vec<serde_json::Value> = merchants.iter().map(|m| serde_json::json!({
                "id": m.id,
                "service_id": m.service_id,
                "email": m.email,
                "display_name": m.display_name,
                "role": m.role,
                "is_active": m.is_active,
                "must_change_password": m.must_change_password,
                "last_login_at": m.last_login_at,
                "created_at": m.created_at,
            })).collect();
            HttpResponse::Ok().json(serde_json::json!({"data": data}))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to list merchants"})),
    }
}

pub async fn create(req: HttpRequest, state: web::Data<AppState>, body: web::Json<CreateMerchantBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    if body.password.len() < 8 {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Password must be at least 8 characters"}));
    }

    // Check if service already has a merchant
    if let Ok(Some(_)) = get_merchant_by_service(&state.db, body.service_id).await {
        return HttpResponse::Conflict().json(serde_json::json!({"error": "This service already has a merchant account. One merchant per service."}));
    }

    let pw_hash = match hash_password(&body.password) {
        Ok(h) => h,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Password hash failed"})),
    };

    match create_merchant_user(&state.db, body.service_id, &body.email, &pw_hash, body.display_name.as_deref()).await {
        Ok(m) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "merchant.created", Some("merchant_user"), Some(&m.id.to_string()), None, None, None, None).await;
            HttpResponse::Created().json(serde_json::json!({
                "id": m.id,
                "email": m.email,
                "service_id": m.service_id,
                "message": "Merchant account created. Share the email and password with the developer."
            }))
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Creation failed: {}", e)})),
    }
}

pub async fn toggle_active(req: HttpRequest, state: web::Data<AppState>, path: web::Path<(Uuid, bool)>) -> HttpResponse {
    let (id, active) = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    match toggle_merchant_active(&state.db, id, active).await {
        Ok(_) => {
            if !active {
                let _ = revoke_all_merchant_sessions(&state.db, id).await;
            }
            let action = if active { "merchant.activated" } else { "merchant.deactivated" };
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), action, Some("merchant_user"), Some(&id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Toggle failed"})),
    }
}

pub async fn reset_password(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<ResetPasswordBody>) -> HttpResponse {
    let id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    if body.new_password.len() < 8 {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Password must be at least 8 characters"}));
    }

    let pw_hash = match hash_password(&body.new_password) {
        Ok(h) => h,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Password hash failed"})),
    };

    match update_merchant_password(&state.db, id, &pw_hash).await {
        Ok(_) => {
            let _ = revoke_all_merchant_sessions(&state.db, id).await;
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "merchant.password_reset", Some("merchant_user"), Some(&id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true, "message": "Password reset. All sessions revoked."}))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Reset failed"})),
    }
}

pub async fn update_commission(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<UpdateCommissionBody>) -> HttpResponse {
    let service_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let ctype = body.commission_type.as_deref().unwrap_or("percentage");

    match sqlx::query("UPDATE services SET commission_rate = $1, commission_type = $2 WHERE id = $3")
        .bind(&body.commission_rate).bind(ctype).bind(service_id).execute(&state.db).await
    {
        Ok(_) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "service.commission_updated", Some("service"), Some(&service_id.to_string()), None, Some(serde_json::json!({"rate": body.commission_rate.to_string(), "type": ctype})), None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Update failed"})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/merchants", web::get().to(list))
       .route("/merchants", web::post().to(create))
       .route("/merchants/{id}/active/{active}", web::put().to(toggle_active))
       .route("/merchants/{id}/reset-password", web::post().to(reset_password))
       .route("/services/{id}/commission", web::patch().to(update_commission));
}
