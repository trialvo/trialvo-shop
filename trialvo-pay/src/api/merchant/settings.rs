use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use serde::Deserialize;
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::db::services::get_service_by_id;
use crate::db::config::get_config;
use crate::AppState;

#[derive(Deserialize)]
pub struct UpdateSettingsBody {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub logo_url: Option<String>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub skip_preview: Option<bool>,
}

pub async fn get_settings(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    let service = match get_service_by_id(&state.db, auth.service_id).await {
        Ok(Some(s)) => s,
        _ => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Service not found"})),
    };

    let base_url = get_config(&state.db, "general", "base_url").await
        .unwrap_or(Some("https://pay.trialvo.com".to_string()))
        .unwrap_or("https://pay.trialvo.com".to_string());

    HttpResponse::Ok().json(serde_json::json!({
        "service_id": service.id,
        "slug": service.slug,
        "display_name": service.display_name,
        "description": service.description,
        "contact_email": service.contact_email,
        "contact_phone": service.contact_phone,
        "logo_url": service.logo_url,
        "success_url": service.success_url,
        "fail_url": service.fail_url,
        "cancel_url": service.cancel_url,
        "is_sandbox": service.is_sandbox,
        "is_active": service.is_active,
        "commission_rate": service.commission_rate,
        "commission_type": service.commission_type,
        "daily_tx_limit": service.daily_tx_limit,
        "monthly_tx_limit": service.monthly_tx_limit,
        "max_single_amount": service.max_single_amount,
        "min_single_amount": service.min_single_amount,
        "skip_preview": service.meta.get("skip_preview").and_then(|v| v.as_bool()).unwrap_or(false),
        "base_url": base_url,
        "api_base_url": format!("{}/api/v1", base_url),
        "created_at": service.created_at,
    }))
}

pub async fn update_settings(req: HttpRequest, state: web::Data<AppState>, body: web::Json<UpdateSettingsBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    if auth.role == "viewer" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Viewers cannot modify settings"}));
    }

    // Build dynamic UPDATE query
    let mut sets = vec![];
    let mut param_idx = 1u32;
    let mut params: Vec<Option<String>> = vec![];

    macro_rules! maybe_set {
        ($field:ident, $col:expr) => {
            if let Some(ref v) = body.$field {
                param_idx += 1;
                sets.push(format!("{} = ${}", $col, param_idx));
                params.push(Some(v.clone()));
            }
        };
    }

    maybe_set!(display_name, "display_name");
    maybe_set!(description, "description");
    maybe_set!(contact_email, "contact_email");
    maybe_set!(contact_phone, "contact_phone");
    maybe_set!(logo_url, "logo_url");
    maybe_set!(success_url, "success_url");
    maybe_set!(fail_url, "fail_url");
    maybe_set!(cancel_url, "cancel_url");

    if sets.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "No fields to update"}));
    }

    let sql = format!("UPDATE services SET {} WHERE id = $1 RETURNING id", sets.join(", "));

    let mut query = sqlx::query(&sql).bind(auth.service_id);
    for p in &params {
        query = query.bind(p);
    }

    match query.fetch_one(&state.db).await {
        Ok(_) => {
            // Update meta.skip_preview if provided
            if let Some(skip) = body.skip_preview {
                let _ = sqlx::query(
                    "UPDATE services SET meta = jsonb_set(COALESCE(meta, '{}'), '{skip_preview}', $1::jsonb), updated_at = NOW() WHERE id = $2"
                )
                .bind(serde_json::json!(skip))
                .bind(auth.service_id)
                .execute(&state.db)
                .await;
            }

            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.settings_updated", Some("service"), Some(&auth.service_id.to_string()), None, None, None, None).await;
            // Return the updated settings
            get_settings(req, state).await
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Update failed: {}", e)})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/settings", web::get().to(get_settings))
       .route("/settings", web::patch().to(update_settings));
}
