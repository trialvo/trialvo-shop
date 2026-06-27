use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use uuid::Uuid;
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::db::services::{get_active_keys_by_service, create_service_key, revoke_service_key, get_key_by_id};
use crate::crypto::hmac::{generate_service_secret, hash_key_for_lookup};
use crate::AppState;

pub async fn list_keys(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    match get_active_keys_by_service(&state.db, auth.service_id).await {
        Ok(keys) => {
            let key_list: Vec<serde_json::Value> = keys.iter().map(|k| serde_json::json!({
                "id": k.id,
                "key_prefix": k.key_prefix,
                "is_primary": k.is_primary,
                "last_used_at": k.last_used_at,
                "created_at": k.created_at,
            })).collect();
            HttpResponse::Ok().json(serde_json::json!({"data": key_list}))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to list keys"})),
    }
}

pub async fn generate_key(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    if auth.role != "owner" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Only owners can generate keys"}));
    }

    let raw_key = generate_service_secret();
    let key_hash = hash_key_for_lookup(&raw_key);
    let key_prefix = format!("pvk_{}", &raw_key[..8]);

    let encrypted = match crate::crypto::aes::encrypt(&state.config.master_key, &raw_key) {
        Ok(e) => e,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Encryption failed"})),
    };

    match create_service_key(&state.db, auth.service_id, &key_hash, encrypted.as_bytes(), &key_prefix).await {
        Ok(key) => {
            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.key_generated", Some("service_key"), Some(&key.id.to_string()), None, None, None, None).await;
            HttpResponse::Created().json(serde_json::json!({
                "id": key.id,
                "raw_key": raw_key,
                "key_prefix": key_prefix,
                "warning": "Copy this key now — it won't be shown again in full."
            }))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Key creation failed"})),
    }
}

pub async fn reveal_key(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let key_id = path.into_inner();

    if auth.role != "owner" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Only owners can reveal keys"}));
    }

    let key = match get_key_by_id(&state.db, key_id).await {
        Ok(Some(k)) => k,
        _ => return HttpResponse::NotFound().json(serde_json::json!({"error": "Key not found"})),
    };

    if key.service_id != auth.service_id {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Key does not belong to your service"}));
    }

    let encrypted_hex = match String::from_utf8(key.encrypted_key.clone()) {
        Ok(h) => h,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Key format error"})),
    };

    let decrypted = match crate::crypto::aes::decrypt(&state.config.master_key, &encrypted_hex) {
        Ok(d) => d,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Decryption failed"})),
    };

    let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.key_revealed", Some("service_key"), Some(&key_id.to_string()), None, None, None, None).await;

    HttpResponse::Ok().json(serde_json::json!({
        "id": key.id,
        "raw_key": decrypted,
        "key_prefix": key.key_prefix,
    }))
}

pub async fn revoke_key(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let key_id = path.into_inner();

    if auth.role != "owner" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Only owners can revoke keys"}));
    }

    let key = match get_key_by_id(&state.db, key_id).await {
        Ok(Some(k)) => k,
        _ => return HttpResponse::NotFound().json(serde_json::json!({"error": "Key not found"})),
    };

    if key.service_id != auth.service_id {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Key does not belong to your service"}));
    }

    match revoke_service_key(&state.db, key_id, "Revoked by merchant").await {
        Ok(_) => {
            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.key_revoked", Some("service_key"), Some(&key_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Revoke failed"})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/keys", web::get().to(list_keys))
       .route("/keys", web::post().to(generate_key))
       .route("/keys/{id}/reveal", web::post().to(reveal_key))
       .route("/keys/{id}", web::delete().to(revoke_key));
}
