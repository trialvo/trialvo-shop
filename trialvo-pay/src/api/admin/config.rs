use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use serde::Deserialize;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::db::config::*;
use crate::db::audit;
use crate::AppState;

#[derive(Deserialize)]
pub struct UpdateConfigBody { pub value: String }

pub async fn list_all(state: web::Data<AppState>) -> HttpResponse {
    match get_all_config(&state.db).await {
        Ok(entries) => {
            // Mask secrets
            let masked: Vec<_> = entries.iter().map(|e| serde_json::json!({
                "category": e.category,
                "key_name": e.key_name,
                "value": if e.is_secret { "***" } else { &e.value },
                "description": e.description,
                "is_secret": e.is_secret,
                "is_active": e.is_active,
            })).collect();
            HttpResponse::Ok().json(serde_json::json!({"data": masked}))
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub async fn update(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<(String, String)>,
    body: web::Json<UpdateConfigBody>,
) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let (category, key) = path.into_inner();

    // Only superadmin can update EPS credentials and security settings
    if (category == "eps" || category == "security") && auth.role != "superadmin" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Insufficient permissions"}));
    }

    // Auto-encrypt EPS secret values
    let value_to_store = if category == "eps" && key.contains("username") || key.contains("password") || key.contains("hash_key") {
        match crate::crypto::aes::encrypt(&state.config.master_key, &body.value) {
            Ok(enc) => enc,
            Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Encryption failed"})),
        }
    } else {
        body.value.clone()
    };

    match set_config(&state.db, &category, &key, &value_to_store, Some(auth.admin_id)).await {
        Ok(_) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()),
                "config.update", Some("config"), Some(&format!("{}:{}", category, key)),
                None, Some(serde_json::json!({"key": format!("{}:{}", category, key)})),
                None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        },
        Err(e) => { tracing::error!("Config update failed: {}", e); HttpResponse::InternalServerError().json(serde_json::json!({"error": "Update failed"})) },
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/config")
            .route("", web::get().to(list_all))
            .route("/{category}/{key}", web::patch().to(update))
    );
}
