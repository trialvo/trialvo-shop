use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use uuid::Uuid;
use serde::Deserialize;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::db::ipn::*;
use crate::db::audit;
use crate::AppState;

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

#[derive(Deserialize)]
pub struct CreateEndpointBody {
    pub service_id: Uuid,
    pub url: String,
    pub events: Vec<String>,
}

#[derive(Deserialize)]
pub struct UpdateEndpointBody {
    pub url: Option<String>,
    pub events: Option<Vec<String>>,
    pub is_active: Option<bool>,
}

// ─── List ALL endpoints across all services (admin overview) ─────────────────

pub async fn list_all_endpoints(state: web::Data<AppState>) -> HttpResponse {
    match sqlx::query_as::<_, IpnEndpoint>(
        r#"SELECT * FROM ipn_endpoints ORDER BY created_at DESC LIMIT 200"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(eps) => HttpResponse::Ok().json(serde_json::json!({
            "data": eps,
            "valid_events": VALID_EVENTS,
        })),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

// ─── List endpoints for a specific service ───────────────────────────────────

pub async fn list_endpoints(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    match list_endpoints_by_service(&state.db, path.into_inner()).await {
        Ok(endpoints) => HttpResponse::Ok().json(serde_json::json!({
            "data": endpoints,
            "valid_events": VALID_EVENTS,
        })),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

// ─── Create endpoint (auto-generates secret) ─────────────────────────────────

pub async fn create_endpoint(req: HttpRequest, state: web::Data<AppState>, body: web::Json<CreateEndpointBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    if !body.url.starts_with("https://") && !body.url.starts_with("http://") {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Webhook URL must start with http:// or https://"}));
    }

    for event in &body.events {
        if !VALID_EVENTS.contains(&event.as_str()) {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!("Invalid event: {}. Valid: {:?}", event, VALID_EVENTS)
            }));
        }
    }

    if body.events.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "At least one event is required"}));
    }

    // Auto-generate secret — never accept it from the request body
    let secret = crate::crypto::hmac::generate_service_secret();

    match create_ipn_endpoint(&state.db, body.service_id, &body.url, &secret, &body.events).await {
        Ok(ep) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.endpoint_created", Some("ipn_endpoint"), Some(&ep.id.to_string()), None, None, None, None).await;
            HttpResponse::Created().json(serde_json::json!({
                "id": ep.id,
                "url": ep.url,
                "events": ep.events,
                "secret": secret,
                "is_active": ep.is_active,
                "warning": "Save this secret now — it won't be shown again. Use it to verify IPN signatures."
            }))
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Create failed: {}", e)})),
    }
}

// ─── Update endpoint (URL, events, active toggle) ────────────────────────────

pub async fn update_endpoint(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<UpdateEndpointBody>) -> HttpResponse {
    let endpoint_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    // Validate events if provided
    if let Some(ref events) = body.events {
        for event in events {
            if !VALID_EVENTS.contains(&event.as_str()) {
                return HttpResponse::BadRequest().json(serde_json::json!({
                    "error": format!("Invalid event: {}", event)
                }));
            }
        }
    }

    let mut sets: Vec<String> = vec![];

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

    sets.push("updated_at = NOW()".to_string());
    let sql = format!("UPDATE ipn_endpoints SET {} WHERE id = $1 RETURNING id", sets.join(", "));

    match sqlx::query(&sql).bind(endpoint_id).fetch_one(&state.db).await {
        Ok(_) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.endpoint_updated", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Update failed: {}", e)})),
    }
}

// ─── Delete endpoint ─────────────────────────────────────────────────────────

pub async fn delete_endpoint(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let endpoint_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    match sqlx::query("DELETE FROM ipn_endpoints WHERE id = $1")
        .bind(endpoint_id)
        .execute(&state.db)
        .await
    {
        Ok(r) if r.rows_affected() > 0 => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.endpoint_deleted", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Endpoint not found"})),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Delete failed: {}", e)})),
    }
}

// ─── Test ping an endpoint ────────────────────────────────────────────────────

pub async fn test_endpoint(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let endpoint_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    let endpoint = match sqlx::query_as::<_, IpnEndpoint>("SELECT * FROM ipn_endpoints WHERE id = $1")
        .bind(endpoint_id)
        .fetch_optional(&state.db)
        .await
    {
        Ok(Some(ep)) => ep,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Endpoint not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Lookup failed"})),
    };

    let test_payload = serde_json::json!({
        "event": "test.ping",
        "service_id": endpoint.service_id,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "message": "This is a test webhook from Trialvo Pay Admin. Your endpoint is working correctly.",
        "sent_by": "admin"
    });

    let signature = crate::crypto::hmac::sign_ipn_payload(&endpoint.secret, &test_payload.to_string());

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap();

    let result = client.post(&endpoint.url)
        .header("Content-Type", "application/json")
        .header("X-Trialvo-Pay-Signature", &signature)
        .header("X-Trialvo-Pay-Event", "test.ping")
        .json(&test_payload)
        .send()
        .await;

    let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.endpoint_tested", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;

    match result {
        Ok(resp) => {
            let status = resp.status().as_u16();
            let body = resp.text().await.unwrap_or_default();
            HttpResponse::Ok().json(serde_json::json!({
                "success": status >= 200 && status < 300,
                "http_status": status,
                "response_body": body.chars().take(500).collect::<String>(),
                "endpoint_url": endpoint.url,
            }))
        }
        Err(e) => HttpResponse::Ok().json(serde_json::json!({
            "success": false,
            "error": format!("Connection failed: {}", e),
            "endpoint_url": endpoint.url,
        })),
    }
}

// ─── Delivery logs for a specific endpoint ────────────────────────────────────

pub async fn endpoint_deliveries(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let endpoint_id = path.into_inner();
    match sqlx::query_as::<_, IpnDelivery>(
        "SELECT * FROM ipn_deliveries WHERE ipn_endpoint_id = $1 ORDER BY created_at DESC LIMIT 100"
    )
    .bind(endpoint_id)
    .fetch_all(&state.db)
    .await
    {
        Ok(deliveries) => HttpResponse::Ok().json(serde_json::json!({"data": deliveries})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

// ─── Recent deliveries across ALL services ────────────────────────────────────

pub async fn recent_deliveries(state: web::Data<AppState>) -> HttpResponse {
    match sqlx::query_as::<_, IpnDelivery>(
        r#"SELECT d.* FROM ipn_deliveries d
           ORDER BY d.created_at DESC LIMIT 100"#
    )
    .fetch_all(&state.db)
    .await
    {
        Ok(deliveries) => HttpResponse::Ok().json(serde_json::json!({"data": deliveries})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/ipn")
            // All-services overview
            .route("/endpoints", web::get().to(list_all_endpoints))
            .route("/endpoints", web::post().to(create_endpoint))
            .route("/endpoints/{id}", web::patch().to(update_endpoint))
            .route("/endpoints/{id}", web::delete().to(delete_endpoint))
            .route("/endpoints/{id}/test", web::post().to(test_endpoint))
            .route("/endpoints/{id}/deliveries", web::get().to(endpoint_deliveries))
            .route("/deliveries/recent", web::get().to(recent_deliveries))
            // Per-service (kept for backward compat)
            .route("/services/{service_id}/endpoints", web::get().to(list_endpoints))
    );
}
