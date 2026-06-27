use anyhow::Result;
use sqlx::{PgPool, Row};

use crate::crypto::hmac::sign_ipn_payload;
use crate::db::ipn::{get_pending_deliveries, update_delivery_failed, update_delivery_success};

/// Background worker: retry failed IPN deliveries with exponential backoff.
/// Runs every 30 seconds.
pub async fn run_retry_worker(pool: PgPool) {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .expect("HTTP client build failed");

    loop {
        match process_pending_deliveries(&pool, &client).await {
            Ok(count) if count > 0 => {
                tracing::info!("IPN retry worker processed {} deliveries", count);
            }
            Err(e) => {
                tracing::error!("IPN retry worker error: {}", e);
            }
            _ => {}
        }

        tokio::time::sleep(std::time::Duration::from_secs(30)).await;
    }
}

async fn process_pending_deliveries(pool: &PgPool, client: &reqwest::Client) -> Result<usize> {
    let deliveries = get_pending_deliveries(pool).await?;
    let count = deliveries.len();

    for delivery in deliveries {
        // Get endpoint URL from DB
        let endpoint = sqlx::query(
            "SELECT url, secret FROM ipn_endpoints WHERE id = $1"
        )
        .bind(delivery.ipn_endpoint_id)
        .fetch_optional(pool)
        .await?;

        let endpoint = match endpoint {
            Some(e) => e,
            None => continue,
        };

        let url: String = endpoint.try_get("url")?;
        let secret: String = endpoint.try_get("secret")?;

        let payload_str = serde_json::to_string(&delivery.payload).unwrap_or_default();
        let signature = sign_ipn_payload(&secret, &payload_str);



        let result = client.post(&url)
            .header("Content-Type", "application/json")
            .header("X-Trialvo-Pay-Signature", &signature)
            .header("X-Trialvo-Pay-Event", &delivery.event_type)
            .header("X-Trialvo-Pay-Delivery-Id", delivery.id.to_string())
            .body(payload_str)
            .send()
            .await;

        match result {
            Ok(resp) => {
                let status = resp.status().as_u16() as i16;
                let body = resp.text().await.unwrap_or_default();
                if (200..300).contains(&(status as u16)) {
                    update_delivery_success(pool, delivery.id, status, &body).await?;
                } else {
                    update_delivery_failed(
                        pool,
                        delivery.id,
                        Some(status),
                        &format!("HTTP {} non-success", status),
                        delivery.attempt_count,
                        delivery.max_attempts,
                    )
                    .await?;
                }
            }
            Err(e) => {
                update_delivery_failed(
                    pool,
                    delivery.id,
                    None,
                    &e.to_string(),
                    delivery.attempt_count,
                    delivery.max_attempts,
                )
                .await?;
            }
        }
    }

    Ok(count)
}
