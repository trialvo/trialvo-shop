use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

// ─── Refund model ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Refund {
    pub id: Uuid,
    pub transaction_id: Uuid,
    pub bill_id: Uuid,
    pub service_id: Uuid,
    pub refund_amount: BigDecimal,
    pub refund_reason: String,
    pub refund_type: Option<String>,
    pub external_order_id: Option<String>,
    pub external_ref: Option<String>,
    pub status: String,
    pub requested_by: String,
    pub approved_by: Option<Uuid>,
    pub processed_by: Option<String>,
    pub rejection_reason: Option<String>,
    pub admin_notes: Option<String>,
    pub gateway_refund_ref: Option<String>,
    pub gateway_response: Option<serde_json::Value>,
    pub requested_at: DateTime<Utc>,
    pub approved_at: Option<DateTime<Utc>>,
    pub processed_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub rejected_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn create_refund_request(
    pool: &PgPool,
    transaction_id: Uuid,
    bill_id: Uuid,
    service_id: Uuid,
    refund_amount: &BigDecimal,
    refund_reason: &str,
    refund_type: &str,
    external_order_id: Option<&str>,
    external_ref: Option<&str>,
    requested_by: &str,
) -> Result<Refund> {
    let refund = sqlx::query_as::<_, Refund>(
        r#"INSERT INTO refunds (
            transaction_id, bill_id, service_id, refund_amount, refund_reason, refund_type,
            external_order_id, external_ref, requested_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *"#
    )
    .bind(transaction_id)
    .bind(bill_id)
    .bind(service_id)
    .bind(refund_amount)
    .bind(refund_reason)
    .bind(refund_type)
    .bind(external_order_id)
    .bind(external_ref)
    .bind(requested_by)
    .fetch_one(pool)
    .await?;

    log_refund_event(pool, refund.id, "requested", None, Some("requested"),
        serde_json::json!({"reason": refund_reason}), requested_by).await?;

    Ok(refund)
}

pub async fn approve_refund(
    pool: &PgPool,
    refund_id: Uuid,
    admin_id: Uuid,
    admin_notes: Option<&str>,
) -> Result<Refund> {
    let refund = sqlx::query_as::<_, Refund>(
        r#"UPDATE refunds SET
            status = 'approved',
            approved_by = $1,
            admin_notes = $2,
            approved_at = NOW()
        WHERE id = $3 AND status = 'requested'
        RETURNING *"#
    )
    .bind(admin_id)
    .bind(admin_notes)
    .bind(refund_id)
    .fetch_one(pool)
    .await?;

    log_refund_event(pool, refund_id, "approved", Some("requested"), Some("approved"),
        serde_json::json!({"admin_id": admin_id}), &admin_id.to_string()).await?;

    Ok(refund)
}

pub async fn reject_refund(
    pool: &PgPool,
    refund_id: Uuid,
    admin_id: Uuid,
    rejection_reason: &str,
) -> Result<Refund> {
    let refund = sqlx::query_as::<_, Refund>(
        r#"UPDATE refunds SET
            status = 'rejected',
            rejection_reason = $1,
            approved_by = $2,
            rejected_at = NOW()
        WHERE id = $3 AND status = 'requested'
        RETURNING *"#
    )
    .bind(rejection_reason)
    .bind(admin_id)
    .bind(refund_id)
    .fetch_one(pool)
    .await?;

    log_refund_event(pool, refund_id, "rejected", Some("requested"), Some("rejected"),
        serde_json::json!({"reason": rejection_reason}), &admin_id.to_string()).await?;

    Ok(refund)
}

pub async fn get_refund_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Refund>> {
    let refund = sqlx::query_as::<_, Refund>("SELECT * FROM refunds WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(refund)
}

pub async fn list_pending_refunds(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<Refund>> {
    let refunds = sqlx::query_as::<_, Refund>(
        "SELECT * FROM refunds WHERE status = 'requested' ORDER BY requested_at ASC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(refunds)
}

pub async fn list_refunds(
    pool: &PgPool,
    service_id: Option<Uuid>,
    status: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Refund>> {
    let refunds = sqlx::query_as::<_, Refund>(
        r#"SELECT * FROM refunds
        WHERE ($1::uuid IS NULL OR service_id = $1)
          AND ($2::text IS NULL OR status::text = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4"#
    )
    .bind(service_id)
    .bind(status)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(refunds)
}

pub async fn count_pending_refunds(pool: &PgPool) -> Result<i64> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM refunds WHERE status = 'requested'"
    )
    .fetch_one(pool)
    .await?;
    Ok(count)
}

async fn log_refund_event(
    pool: &PgPool,
    refund_id: Uuid,
    event_type: &str,
    old_status: Option<&str>,
    new_status: Option<&str>,
    event_data: serde_json::Value,
    actor: &str,
) -> Result<()> {
    sqlx::query(
        r#"INSERT INTO refund_events (refund_id, event_type, old_status, new_status, event_data, actor)
        VALUES ($1, $2, $3, $4, $5, $6)"#
    )
    .bind(refund_id)
    .bind(event_type)
    .bind(old_status)
    .bind(new_status)
    .bind(event_data)
    .bind(actor)
    .execute(pool)
    .await?;
    Ok(())
}
