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
        if events.is_empty() {
            return HttpResponse::BadRequest().json(serde_json::json!({"error": "At least one event is required"}));
        }
        for event in events {
            if !VALID_EVENTS.contains(&event.as_str()) {
                return HttpResponse::BadRequest().json(serde_json::json!({
                    "error": format!("Invalid event: {}", event)
                }));
            }
        }
    }

    // Use sqlx QueryBuilder for dynamic updates if many fields, 
    // but here we only have 3, so a simple approach is fine.
    // However, to be safe and clean, let's use a more structured way.

    let res = sqlx::query(
        r#"UPDATE ipn_endpoints SET 
            url = COALESCE($1, url),
            events = COALESCE($2, events),
            is_active = COALESCE($3, is_active),
            updated_at = NOW()
        WHERE id = $4 RETURNING id"#
    )
    .bind(&body.url)
    .bind(&body.events)
    .bind(body.is_active)
    .bind(endpoint_id)
    .fetch_optional(&state.db)
    .await;

    match res {
        Ok(Some(_)) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.endpoint_updated", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Endpoint not found"})),
        Err(e) => {
            tracing::error!("Update failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Update failed: {}", e)}))
        }
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
        .user_agent("TrialvoPay/1.0")
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
            let success = status >= 200 && status < 300;

            if success {
                let _ = sqlx::query("UPDATE ipn_endpoints SET last_success_at = NOW(), failure_count = 0 WHERE id = $1")
                    .bind(endpoint_id)
                    .execute(&state.db)
                    .await;
            } else {
                let _ = sqlx::query("UPDATE ipn_endpoints SET last_failure_at = NOW(), failure_count = failure_count + 1 WHERE id = $1")
                    .bind(endpoint_id)
                    .execute(&state.db)
                    .await;
            }

            HttpResponse::Ok().json(serde_json::json!({
                "success": success,
                "http_status": status,
                "response_body": body.chars().take(500).collect::<String>(),
                "endpoint_url": endpoint.url,
            }))
        }
        Err(e) => {
            let _ = sqlx::query("UPDATE ipn_endpoints SET last_failure_at = NOW(), failure_count = failure_count + 1 WHERE id = $1")
                .bind(endpoint_id)
                .execute(&state.db)
                .await;
            HttpResponse::Ok().json(serde_json::json!({
                "success": false,
                "error": format!("Connection failed: {}", e),
                "endpoint_url": endpoint.url,
            }))
        }
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

// ─── Retry a specific delivery ───────────────────────────────────────────────

pub async fn retry_delivery(req: HttpRequest, state: web::Data<AppState>, path: web::Path<i64>) -> HttpResponse {
    let delivery_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    let delivery = match sqlx::query_as::<_, IpnDelivery>("SELECT * FROM ipn_deliveries WHERE id = $1")
        .bind(delivery_id)
        .fetch_optional(&state.db)
        .await
    {
        Ok(Some(d)) => d,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Delivery not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Lookup failed"})),
    };

    let endpoint = match sqlx::query_as::<_, IpnEndpoint>("SELECT * FROM ipn_endpoints WHERE id = $1")
        .bind(delivery.ipn_endpoint_id)
        .fetch_optional(&state.db)
        .await
    {
        Ok(Some(ep)) => ep,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Endpoint no longer exists"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Endpoint lookup failed"})),
    };

    let payload_str = delivery.payload.to_string();
    let signature = crate::crypto::hmac::sign_ipn_payload(&endpoint.secret, &payload_str);

    // Run attempt immediately
    crate::ipn::dispatcher::attempt_delivery(
        &state.db,
        &state.ipn_client,
        delivery_id,
        &endpoint.url,
        &payload_str,
        &signature,
        &delivery.event_type
    ).await;

    let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.delivery_retried", Some("ipn_delivery"), Some(&delivery_id.to_string()), None, None, None, None).await;

    HttpResponse::Ok().json(serde_json::json!({"success": true}))
}

// ─── Rotate endpoint secret ──────────────────────────────────────────────────

pub async fn rotate_endpoint_secret(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let endpoint_id = path.into_inner();
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();

    let new_secret = crate::crypto::hmac::generate_service_secret();

    match sqlx::query("UPDATE ipn_endpoints SET secret = $1, updated_at = NOW() WHERE id = $2 RETURNING id")
        .bind(&new_secret)
        .bind(endpoint_id)
        .fetch_optional(&state.db)
        .await
    {
        Ok(Some(_)) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "ipn.secret_rotated", Some("ipn_endpoint"), Some(&endpoint_id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "new_secret": new_secret,
                "warning": "Save this secret now — it won't be shown again."
            }))
        }
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Endpoint not found"})),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Rotation failed: {}", e)})),
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
            .route("/endpoints/{id}/rotate-secret", web::post().to(rotate_endpoint_secret))
            .route("/endpoints/{id}/deliveries", web::get().to(endpoint_deliveries))
            .route("/deliveries/recent", web::get().to(recent_deliveries))
            .route("/deliveries/{id}/retry", web::post().to(retry_delivery))
            // Per-service (kept for backward compat)
            .route("/services/{service_id}/endpoints", web::get().to(list_endpoints))
    );
}
