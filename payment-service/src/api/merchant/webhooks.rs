use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::db::ipn::*;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateWebhookBody {
    pub url: String,
    pub events: Vec<String>,
}

#[derive(Deserialize)]
pub struct UpdateWebhookBody {
    pub url: Option<String>,
    pub events: Option<Vec<String>>,
    pub is_active: Option<bool>,
}

const VALID_EVENTS: &[&str] = &[
    "payment.success",
    "payment.failed",
    "payment.expired",
    "payment.cancelled",
    "refund.requested",
    "refund.approved",
    "refund.rejected",
    "bill.created",
    "bill.cancelled",
];

pub async fn list_webhooks(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    match list_endpoints_by_service(&state.db, auth.service_id).await {
        Ok(endpoints) => HttpResponse::Ok().json(serde_json::json!({
            "data": endpoints,
            "valid_events": VALID_EVENTS,
        })),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to list webhooks"})),
    }
}

pub async fn create_webhook(req: HttpRequest, state: web::Data<AppState>, body: web::Json<CreateWebhookBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    if auth.role == "viewer" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Viewers cannot manage webhooks"}));
    }

    // Validate URL
    if !body.url.starts_with("https://") && !body.url.starts_with("http://") {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Webhook URL must start with https:// or http://"}));
    }

    // Validate events
    for event in &body.events {
        if !VALID_EVENTS.contains(&event.as_str()) {
            return HttpResponse::BadRequest().json(serde_json::json!({"error": format!("Invalid event: {}. Valid events: {:?}", event, VALID_EVENTS)}));
        }
    }

    if body.events.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "At least one event is required"}));
    }

    let secret = crate::crypto::hmac::generate_service_secret();
    match create_ipn_endpoint(&state.db, auth.service_id, &body.url, &secret, &body.events).await {
        Ok(ep) => {
            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.webhook_created", Some("ipn_endpoint"), Some(&ep.id.to_string()), None, None, None, None).await;
            HttpResponse::Created().json(serde_json::json!({
                "id": ep.id,
                "url": ep.url,
                "events": ep.events,
                "secret": secret,
                "is_active": ep.is_active,
                "warning": "Save this secret now — it won't be shown again. Use it to verify IPN signatures."
            }))
        }
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to create webhook"})),
    }
}

pub async fn update_webhook(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<UpdateWebhookBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let endpoint_id = path.into_inner();

    if auth.role == "viewer" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Viewers cannot manage webhooks"}));
    }

    // Verify the endpoint belongs to this service
    let endpoints = match list_endpoints_by_service(&state.db, auth.service_id).await {
        Ok(eps) => eps,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Lookup failed"})),
    };
    if !endpoints.iter().any(|e| e.id == endpoint_id) {
        return HttpResponse::NotFound().json(serde_json::json!({"error": "Webhook not found"}));
    }

    // Validate events if provided
    if let Some(ref events) = body.events {
        for event in events {
            if !VALID_EVENTS.contains(&event.as_str()) {
                return HttpResponse::BadRequest().json(serde_json::json!({"error": format!("Invalid event: {}", event)}));
            }
        }
    }

    // Build update
    let mut sets = vec![];
    if let Some(ref url) = body.url {
        sets.push(format!("url = '{}'", url.replace('\'', "''")));
    }
    if let Some(ref events) = body.events {
        let ev_str: Vec<String> = events.iter().map(|e| format!("'{}'", e.replace('\'', "''"))).collect();
        sets.push(format!("events = ARRAY[{}]::text[]", ev_str.join(",")));
    }
    if let Some(is_active) = body.is_active {
        sets.push(format!("is_active = {}", is_active));
    }

    if sets.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "No fields to update"}));
    }

    let sql = format!("UPDATE ipn_endpoints SET {} WHERE id = $1 AND service_id = $2", sets.join(", "));
    match sqlx::query(&sql).bind(endpoint_id).bind(auth.service_id).execute(&state.db).await {
        Ok(_) => {
            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.webhook_updated", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Update failed: {}", e)})),
    }
}

pub async fn delete_webhook(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let endpoint_id = path.into_inner();

    if auth.role == "viewer" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Viewers cannot manage webhooks"}));
    }

    match sqlx::query("DELETE FROM ipn_endpoints WHERE id = $1 AND service_id = $2")
        .bind(endpoint_id).bind(auth.service_id).execute(&state.db).await
    {
        Ok(r) if r.rows_affected() > 0 => {
            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.webhook_deleted", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Webhook not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Delete failed"})),
    }
}

pub async fn test_webhook(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let endpoint_id = path.into_inner();

    // Verify ownership
    let endpoints = match list_endpoints_by_service(&state.db, auth.service_id).await {
        Ok(eps) => eps,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Lookup failed"})),
    };
    let endpoint = match endpoints.iter().find(|e| e.id == endpoint_id) {
        Some(e) => e.clone(),
        None => return HttpResponse::NotFound().json(serde_json::json!({"error": "Webhook not found"})),
    };

    // Send test ping
    let test_payload = serde_json::json!({
        "event": "test.ping",
        "service_id": auth.service_id,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "message": "This is a test webhook from PayVault. If you receive this, your endpoint is working correctly."
    });

    let signature = crate::crypto::hmac::sign_ipn_payload(&endpoint.secret, &test_payload.to_string());

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap();

    match client.post(&endpoint.url)
        .header("Content-Type", "application/json")
        .header("X-PayVault-Signature", &signature)
        .header("X-PayVault-Event", "test.ping")
        .json(&test_payload)
        .send()
        .await
    {
        Ok(resp) => {
            let status = resp.status().as_u16();
            let body = resp.text().await.unwrap_or_default();
            HttpResponse::Ok().json(serde_json::json!({
                "success": status >= 200 && status < 300,
                "http_status": status,
                "response_body": body.chars().take(500).collect::<String>(),
                "signature_sent": signature,
            }))
        }
        Err(e) => {
            HttpResponse::Ok().json(serde_json::json!({
                "success": false,
                "error": format!("Connection failed: {}", e),
            }))
        }
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/webhooks", web::get().to(list_webhooks))
       .route("/webhooks", web::post().to(create_webhook))
       .route("/webhooks/{id}", web::patch().to(update_webhook))
       .route("/webhooks/{id}", web::delete().to(delete_webhook))
       .route("/webhooks/{id}/test", web::post().to(test_webhook));
}
