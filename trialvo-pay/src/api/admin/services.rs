use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use uuid::Uuid;
use serde::Deserialize;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::db::services::*;
use crate::db::merchants::create_merchant_user;
use crate::crypto::argon::hash_password;
use crate::db::audit;
use crate::AppState;

#[derive(Deserialize)] pub struct ListQuery { pub page: Option<i64>, pub per_page: Option<i64>, pub limit: Option<i64>, pub offset: Option<i64>, pub is_active: Option<bool> }
#[derive(Deserialize)] pub struct ServiceMeta { pub brand_color: Option<String> }

#[derive(Deserialize)]
pub struct UpdateServiceBody {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub logo_url: Option<String>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub is_sandbox: Option<bool>,
    pub skip_preview: Option<bool>,
}

pub async fn list(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(25);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    match list_services(&state.db, query.is_active, per_page, offset).await {
        Ok(services) => HttpResponse::Ok().json(serde_json::json!({"data": services, "page": page, "per_page": per_page})),
        Err(e) => { tracing::error!("{}", e); HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})) }
    }
}


pub async fn get(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    match get_service_by_id(&state.db, path.into_inner()).await {
        Ok(Some(s)) => HttpResponse::Ok().json(s),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

#[derive(Deserialize)]
pub struct CreateServiceWithMerchantInput {
    // Service fields
    pub slug: String,
    pub display_name: String,
    pub description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub logo_url: Option<String>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub is_sandbox: Option<bool>,
    pub commission_rate: Option<bigdecimal::BigDecimal>,
    pub commission_type: Option<String>,
    pub meta: Option<serde_json::Value>,
    // Optional merchant account fields
    pub merchant_email: Option<String>,
    pub merchant_password: Option<String>,
    pub merchant_display_name: Option<String>,
}

/// Generate a random 16-character alphanumeric password
fn generate_password() -> String {
    use rand::Rng;
    let charset = b"abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let mut rng = rand::thread_rng();
    (0..16).map(|_| {
        let idx = rng.gen_range(0..charset.len());
        charset[idx] as char
    }).collect()
}

pub async fn create(req: HttpRequest, state: web::Data<AppState>, body: web::Json<CreateServiceWithMerchantInput>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let body = body.into_inner();

    // Extract merchant fields before consuming into CreateServiceInput
    let merchant_email = body.merchant_email.clone();
    let merchant_password = body.merchant_password.clone();
    let merchant_display_name = body.merchant_display_name.clone();

    let service_input = CreateServiceInput {
        slug: body.slug,
        display_name: body.display_name,
        description: body.description,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        logo_url: body.logo_url,
        success_url: body.success_url,
        fail_url: body.fail_url,
        cancel_url: body.cancel_url,
        is_sandbox: body.is_sandbox.unwrap_or(true),
        commission_rate: body.commission_rate,
        commission_type: body.commission_type,
        meta: body.meta,
    };

    let s = match create_service(&state.db, service_input).await {
        Ok(s) => s,
        Err(e) => {
            tracing::error!("{}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Create failed"}));
        }
    };

    let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "service.create", Some("service"), Some(&s.id.to_string()), None, Some(serde_json::to_value(&s).unwrap_or_default()), None, None).await;

    // If merchant_email provided, create merchant account automatically
    if let Some(email) = merchant_email {
        if email.trim().is_empty() {
            return HttpResponse::Created().json(serde_json::json!({
                "service": s,
                "merchant": null,
                "message": "Service created. No merchant account (empty email)."
            }));
        }

        // Use provided password or auto-generate
        let raw_password = merchant_password
            .filter(|p| p.len() >= 8)
            .unwrap_or_else(generate_password);

        let pw_hash = match hash_password(&raw_password) {
            Ok(h) => h,
            Err(_) => {
                return HttpResponse::Created().json(serde_json::json!({
                    "service": s,
                    "merchant": null,
                    "merchant_error": "Password hash failed. Create merchant account manually."
                }));
            }
        };

        match create_merchant_user(&state.db, s.id, email.trim(), &pw_hash, merchant_display_name.as_deref()).await {
            Ok(m) => {
                let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "merchant.created", Some("merchant_user"), Some(&m.id.to_string()), None, None, None, None).await;
                HttpResponse::Created().json(serde_json::json!({
                    "service": s,
                    "merchant": {
                        "id": m.id,
                        "email": m.email,
                        "password": raw_password,
                        "must_change_password": true,
                    },
                    "message": "Service and merchant account created. Share the credentials with the developer."
                }))
            }
            Err(e) => {
                tracing::error!("Merchant creation failed after service create: {}", e);
                HttpResponse::Created().json(serde_json::json!({
                    "service": s,
                    "merchant": null,
                    "merchant_error": format!("Service created but merchant account failed: {}", e)
                }))
            }
        }
    } else {
        HttpResponse::Created().json(s)
    }
}

pub async fn toggle_active(req: HttpRequest, state: web::Data<AppState>, path: web::Path<(Uuid, bool)>) -> HttpResponse {
    let (id, active) = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    match toggle_service_active(&state.db, id, active).await {
        Ok(s) => {
            let action = if active { "service.activate" } else { "service.deactivate" };
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), action, Some("service"), Some(&id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(s)
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Update failed"})),
    }
}

// Key management endpoints
pub async fn list_keys(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    match get_active_keys_by_service(&state.db, path.into_inner()).await {
        Ok(keys) => {
            // Mask encrypted_key, only return prefix + metadata
            let masked: Vec<_> = keys.iter().map(|k| serde_json::json!({
                "id": k.id, "key_prefix": k.key_prefix, "is_primary": k.is_primary,
                "grace_until": k.grace_until, "created_at": k.created_at, "last_used_at": k.last_used_at,
            })).collect();
            HttpResponse::Ok().json(serde_json::json!({"data": masked}))
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub async fn generate_key(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let service_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let raw_key = crate::crypto::hmac::generate_service_secret();
    let key_hash = crate::crypto::hmac::hash_key_for_lookup(&raw_key);
    let key_prefix = format!("pvk_{}", &raw_key[..8]);
    let encrypted = crate::crypto::aes::encrypt(&state.config.master_key, &raw_key).unwrap_or_default();
    match create_service_key(&state.db, service_id, &key_hash, encrypted.as_bytes(), &key_prefix).await {
        Ok(key) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "key.generate", Some("service_key"), Some(&key.id.to_string()), None, None, None, None).await;
            // Return raw key ONCE — never stored in plaintext
            HttpResponse::Created().json(serde_json::json!({"id": key.id, "key_prefix": key.key_prefix, "raw_key": raw_key, "warning": "Save this key now. It will never be shown again."}))
        },
        Err(e) => { tracing::error!("{}", e); HttpResponse::InternalServerError().json(serde_json::json!({"error": "Key generation failed"})) }
    }
}

pub async fn revoke_key(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<serde_json::Value>) -> HttpResponse {
    let key_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let reason = body.get("reason").and_then(|v| v.as_str()).unwrap_or("Admin revoked");
    match revoke_service_key(&state.db, key_id, reason).await {
        Ok(_) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "key.revoke", Some("service_key"), Some(&key_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Revoke failed"})),
    }
}

pub async fn reveal_key(req: HttpRequest, state: web::Data<AppState>, path: web::Path<(Uuid, Uuid)>) -> HttpResponse {
    let (service_id, key_id) = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    let key = match get_key_by_id(&state.db, key_id).await {
        Ok(Some(k)) if k.service_id == service_id => k,
        Ok(Some(_)) => return HttpResponse::Forbidden().json(serde_json::json!({"error": "Key does not belong to this service"})),
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Key not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };

    // Decrypt the key - encrypted_key is stored as UTF-8 bytes of a hex string
    let encrypted_hex = match String::from_utf8(key.encrypted_key.clone()) {
        Ok(s) => s,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Invalid encrypted key format"})),
    };
    let raw_key = match crate::crypto::aes::decrypt(
        &state.config.master_key,
        &encrypted_hex,
    ) {
        Ok(k) => k,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Key decryption failed"})),
    };

    // Audit log the reveal
    let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "key.reveal", Some("service_key"), Some(&key_id.to_string()), None, None, None, None).await;

    HttpResponse::Ok().json(serde_json::json!({
        "id": key.id,
        "key_prefix": key.key_prefix,
        "raw_key": raw_key,
        "service_id": key.service_id,
    }))
}

pub async fn update_service(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<UpdateServiceBody>) -> HttpResponse {
    let id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    // Use COALESCE so only provided fields are updated
    let result = sqlx::query(
        r#"UPDATE services SET
            display_name  = COALESCE($2, display_name),
            description   = COALESCE($3, description),
            contact_email = COALESCE($4, contact_email),
            contact_phone = COALESCE($5, contact_phone),
            logo_url      = COALESCE($6, logo_url),
            success_url   = COALESCE($7, success_url),
            fail_url      = COALESCE($8, fail_url),
            cancel_url    = COALESCE($9, cancel_url),
            is_sandbox    = COALESCE($10, is_sandbox),
            updated_at    = NOW()
        WHERE id = $1
        RETURNING id"#
    )
    .bind(id)
    .bind(&body.display_name)
    .bind(&body.description)
    .bind(&body.contact_email)
    .bind(&body.contact_phone)
    .bind(&body.logo_url)
    .bind(&body.success_url)
    .bind(&body.fail_url)
    .bind(&body.cancel_url)
    .bind(body.is_sandbox)
    .fetch_one(&state.db)
    .await;

    match result {
        Ok(_) => {
            // Update meta.skip_preview if provided
            if let Some(skip) = body.skip_preview {
                let _ = sqlx::query(
                    "UPDATE services SET meta = jsonb_set(COALESCE(meta, '{}'), '{skip_preview}', $1::jsonb), updated_at = NOW() WHERE id = $2"
                )
                .bind(serde_json::json!(skip))
                .bind(id)
                .execute(&state.db)
                .await;
            }

            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "service.updated", Some("service"), Some(&id.to_string()), None, None, None, None).await;
            match get_service_by_id(&state.db, id).await {
                Ok(Some(s)) => HttpResponse::Ok().json(s),
                _ => HttpResponse::Ok().json(serde_json::json!({"success": true})),
            }
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Update failed: {}", e)})),
    }
}


pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/services")
            .route("", web::get().to(list))
            .route("", web::post().to(create))
            .route("/{id}", web::get().to(get))
            .route("/{id}", web::patch().to(update_service))
            .route("/{id}/active/{active}", web::patch().to(toggle_active))
            .route("/{id}/keys", web::get().to(list_keys))
            .route("/{id}/keys", web::post().to(generate_key))
            .route("/{id}/keys/{key_id}", web::delete().to(revoke_key))
            .route("/{id}/keys/{key_id}/reveal", web::get().to(reveal_key))
    );
}
