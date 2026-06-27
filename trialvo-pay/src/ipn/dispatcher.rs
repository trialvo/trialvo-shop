use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

use crate::crypto::hmac::sign_ipn_payload;
use crate::db::ipn::{create_delivery, get_endpoints_for_event, update_delivery_success, update_delivery_failed};

/// Dispatch an IPN event to all active endpoints subscribed to this event for the service.
/// Called immediately after payment status changes.
/// Uses the shared HTTP client from AppState for connection pooling.
pub async fn dispatch_event(
    pool: &PgPool,
    client: &reqwest::Client,
    service_id: Uuid,
    event_type: &str,
    payload: &serde_json::Value,
    transaction_id: Option<Uuid>,
    refund_id: Option<Uuid>,
    bill_id: Option<Uuid>,
) -> Result<()> {
    let endpoints = get_endpoints_for_event(pool, service_id, event_type).await?;

    for endpoint in endpoints {
        let payload_str = serde_json::to_string(payload).unwrap_or_default();
        let signature = sign_ipn_payload(&endpoint.secret, &payload_str);

        let delivery_id = create_delivery(
            pool,
            endpoint.id,
            event_type,
            payload,
            &signature,
            transaction_id,
            refund_id,
            bill_id,
        )
        .await?;

        // Clone pool (cheap — PgPool is Arc-backed) and client for the spawn task
        let pool_clone = pool.clone();
        let client_clone = client.clone();
        let url = endpoint.url.clone();
        let payload_clone = payload_str.clone();
        let sig_clone = signature.clone();
        let event_type_clone = event_type.to_string();

        tokio::spawn(async move {
            attempt_delivery(
                &pool_clone,
                &client_clone,
                delivery_id,
                &url,
                &payload_clone,
                &sig_clone,
                &event_type_clone,
            )
            .await;
        });
    }

    Ok(())
}

/// Single delivery attempt to an IPN endpoint.
/// Updates delivery status in DB (success or failure) after the attempt.
/// Status starts as "sending" — transitions to "delivered", "failed", or "exhausted".
async fn attempt_delivery(
    pool: &PgPool,
    client: &reqwest::Client,
    delivery_id: i64,
    url: &str,
    payload: &str,
    signature: &str,
    event_type: &str,
) {
    let result = client
        .post(url)
        .header("Content-Type", "application/json")
        .header("X-Trialvo-Pay-Signature", signature)
        .header("X-Trialvo-Pay-Event", event_type)
        .header("X-Trialvo-Pay-Delivery-Id", delivery_id.to_string())
        .body(payload.to_string())
        .send()
        .await;

    match result {
        Ok(resp) => {
            let status = resp.status().as_u16() as i16;
            let body = resp.text().await.unwrap_or_default();
            if (200..300).contains(&(status as u16)) {
                tracing::info!("IPN delivered to {}: HTTP {}", url, status);
                let _ = update_delivery_success(pool, delivery_id, status, &body).await;
            } else {
                tracing::warn!(
                    "IPN rejected by {}: HTTP {} — {}",
                    url,
                    status,
                    &body[..body.len().min(200)]
                );
                // attempt_count=0 (first attempt), let retry worker handle next attempt with backoff
                let _ = update_delivery_failed(
                    pool,
                    delivery_id,
                    Some(status),
                    &format!("HTTP {} non-success", status),
                    0,
                    5,
                )
                .await;
            }
        }
        Err(e) => {
            tracing::error!("IPN delivery failed to {}: {}", url, e);
            let _ = update_delivery_failed(pool, delivery_id, None, &e.to_string(), 0, 5).await;
        }
    }
}
