use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IpnEndpoint {
    pub id: Uuid,
    pub service_id: Uuid,
    pub url: String,
    pub secret: String,
    pub events: Vec<String>,
    pub is_active: bool,
    pub failure_count: i32,
    pub last_success_at: Option<DateTime<Utc>>,
    pub last_failure_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IpnDelivery {
    pub id: i64,
    pub ipn_endpoint_id: Uuid,
    pub transaction_id: Option<Uuid>,
    pub refund_id: Option<Uuid>,
    pub bill_id: Option<Uuid>,
    pub event_type: String,
    pub payload: serde_json::Value,
    pub signature: String,
    pub status: String,
    pub attempt_count: i16,
    pub max_attempts: i16,
    pub http_status: Option<i16>,
    pub response_body: Option<String>,
    pub error_message: Option<String>,
    pub next_retry_at: Option<DateTime<Utc>>,
    pub first_sent_at: Option<DateTime<Utc>>,
    pub last_sent_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_endpoints_for_event(
    pool: &PgPool,
    service_id: Uuid,
    event_type: &str,
) -> Result<Vec<IpnEndpoint>> {
    let endpoints = sqlx::query_as::<_, IpnEndpoint>(
        "SELECT * FROM ipn_endpoints WHERE service_id = $1 AND is_active = TRUE AND $2 = ANY(events)"
    )
    .bind(service_id)
    .bind(event_type)
    .fetch_all(pool)
    .await?;
    Ok(endpoints)
}

pub async fn create_delivery(
    pool: &PgPool,
    endpoint_id: Uuid,
    event_type: &str,
    payload: &serde_json::Value,
    signature: &str,
    transaction_id: Option<Uuid>,
    refund_id: Option<Uuid>,
    bill_id: Option<Uuid>,
) -> Result<i64> {
    let row = sqlx::query(
        r#"INSERT INTO ipn_deliveries (ipn_endpoint_id, event_type, payload, signature, transaction_id, refund_id, bill_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'sending')
        RETURNING id"#
    )
    .bind(endpoint_id)
    .bind(event_type)
    .bind(payload)
    .bind(signature)
    .bind(transaction_id)
    .bind(refund_id)
    .bind(bill_id)
    .fetch_one(pool)
    .await?;
    Ok(row.try_get("id")?)
}

pub async fn update_delivery_success(pool: &PgPool, delivery_id: i64, http_status: i16, response_body: &str) -> Result<()> {
    sqlx::query(
        r#"UPDATE ipn_deliveries SET
            status = 'delivered',
            http_status = $1,
            response_body = $2,
            attempt_count = attempt_count + 1,
            last_sent_at = NOW(),
            delivered_at = NOW(),
            first_sent_at = COALESCE(first_sent_at, NOW())
        WHERE id = $3"#
    )
    .bind(http_status)
    .bind(response_body)
    .bind(delivery_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub fn next_retry_delay_seconds(attempt: i16) -> i64 {
    match attempt {
        0 => 30,
        1 => 120,
        2 => 480,
        3 => 1800,
        4 => 7200,
        _ => 0,
    }
}

pub async fn update_delivery_failed(
    pool: &PgPool,
    delivery_id: i64,
    http_status: Option<i16>,
    error_message: &str,
    current_attempt: i16,
    max_attempts: i16,
) -> Result<()> {
    let delay = next_retry_delay_seconds(current_attempt);
    let exhausted = current_attempt + 1 >= max_attempts;
    let next_retry = if !exhausted {
        Some(Utc::now() + chrono::Duration::seconds(delay))
    } else {
        None
    };
    let new_status = if exhausted { "exhausted" } else { "failed" };

    sqlx::query(
        r#"UPDATE ipn_deliveries SET
            status = $1,
            http_status = $2,
            error_message = $3,
            attempt_count = attempt_count + 1,
            last_sent_at = NOW(),
            first_sent_at = COALESCE(first_sent_at, NOW()),
            next_retry_at = $4
        WHERE id = $5"#
    )
    .bind(new_status)
    .bind(http_status)
    .bind(error_message)
    .bind(next_retry)
    .bind(delivery_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_pending_deliveries(pool: &PgPool) -> Result<Vec<IpnDelivery>> {
    // Only retry 'failed' deliveries. 'sending' means the first attempt is in flight (spawned task).
    // 'queued' is kept for backwards-compatibility with any deliveries created before this change.
    let deliveries = sqlx::query_as::<_, IpnDelivery>(
        "SELECT * FROM ipn_deliveries WHERE status IN ('queued', 'failed') AND (next_retry_at IS NULL OR next_retry_at <= NOW()) LIMIT 100"
    )
    .fetch_all(pool)
    .await?;
    Ok(deliveries)
}

pub async fn create_ipn_endpoint(
    pool: &PgPool,
    service_id: Uuid,
    url: &str,
    secret: &str,
    events: &[String],
) -> Result<IpnEndpoint> {
    let ep = sqlx::query_as::<_, IpnEndpoint>(
        r#"INSERT INTO ipn_endpoints (service_id, url, secret, events)
        VALUES ($1, $2, $3, $4)
        RETURNING *"#
    )
    .bind(service_id)
    .bind(url)
    .bind(secret)
    .bind(events)
    .fetch_one(pool)
    .await?;
    Ok(ep)
}

pub async fn list_endpoints_by_service(pool: &PgPool, service_id: Uuid) -> Result<Vec<IpnEndpoint>> {
    let eps = sqlx::query_as::<_, IpnEndpoint>(
        "SELECT * FROM ipn_endpoints WHERE service_id = $1 ORDER BY created_at DESC"
    )
    .bind(service_id)
    .fetch_all(pool)
    .await?;
    Ok(eps)
}

pub async fn count_failed_deliveries_24h(pool: &PgPool) -> Result<i64> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM ipn_deliveries WHERE status IN ('failed', 'exhausted') AND created_at > NOW() - interval '24 hours'"
    )
    .fetch_one(pool)
    .await?;
    Ok(count)
}
