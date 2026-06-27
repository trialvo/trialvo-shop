use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: Uuid,
    pub canonical_name: Option<String>,
    pub display_name: Option<String>,
    pub identity_hash: Option<String>,
    pub total_spent: BigDecimal,
    pub total_refunded: BigDecimal,
    pub transaction_count: i32,
    pub risk_score: Option<i16>,
    pub is_blocked: bool,
    pub block_reason: Option<String>,
    pub meta: serde_json::Value,
    pub first_seen_at: DateTime<Utc>,
    pub last_seen_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub fn normalize_phone(phone: &str) -> String {
    let digits: String = phone.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.starts_with("880") && digits.len() == 13 {
        format!("+{}", digits)
    } else if digits.starts_with("01") && digits.len() == 11 {
        format!("+88{}", digits)
    } else if digits.starts_with("1") && digits.len() == 10 {
        format!("+880{}", digits)
    } else {
        format!("+{}", digits)
    }
}

pub fn normalize_email(email: &str) -> String {
    email.trim().to_lowercase()
}

pub fn compute_identity_hash(phones: &[String], emails: &[String], nid_hash: Option<&str>) -> String {
    let mut parts: Vec<String> = phones.iter().chain(emails.iter()).cloned().collect();
    if let Some(nid) = nid_hash {
        parts.push(nid.to_string());
    }
    parts.sort();
    let combined = parts.join("|");
    let hash = Sha256::digest(combined.as_bytes());
    hex::encode(hash)
}

pub async fn resolve_or_create_customer(
    pool: &PgPool,
    name: &str,
    email: &str,
    phone: &str,
    service_id: Uuid,
) -> Result<Uuid> {
    let phone_norm = normalize_phone(phone);
    let email_norm = normalize_email(email);

    // 1. Try phone match
    if let Some(row) = sqlx::query(
        "SELECT customer_id FROM customer_phones WHERE phone_normalized = $1"
    )
    .bind(&phone_norm)
    .fetch_optional(pool)
    .await?
    {
        let customer_id: Uuid = row.try_get("customer_id")?;
        sqlx::query("UPDATE customers SET last_seen_at = NOW() WHERE id = $1")
            .bind(customer_id)
            .execute(pool)
            .await?;
        return Ok(customer_id);
    }

    // 2. Try email match
    if let Some(row) = sqlx::query(
        "SELECT customer_id FROM customer_emails WHERE email_normalized = $1"
    )
    .bind(&email_norm)
    .fetch_optional(pool)
    .await?
    {
        let customer_id: Uuid = row.try_get("customer_id")?;
        let _ = sqlx::query(
            "INSERT INTO customer_phones (customer_id, phone, phone_normalized, source_service) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING"
        )
        .bind(customer_id)
        .bind(phone)
        .bind(&phone_norm)
        .bind(service_id)
        .execute(pool)
        .await;

        sqlx::query("UPDATE customers SET last_seen_at = NOW() WHERE id = $1")
            .bind(customer_id)
            .execute(pool)
            .await?;
        return Ok(customer_id);
    }

    // 3. Create new customer
    let row = sqlx::query(
        "INSERT INTO customers (canonical_name, display_name) VALUES ($1, $2) RETURNING id"
    )
    .bind(name)
    .bind(name)
    .fetch_one(pool)
    .await?;
    let cid: Uuid = row.try_get("id")?;

    sqlx::query(
        "INSERT INTO customer_phones (customer_id, phone, phone_normalized, is_primary, source_service) VALUES ($1, $2, $3, TRUE, $4) ON CONFLICT DO NOTHING"
    )
    .bind(cid).bind(phone).bind(&phone_norm).bind(service_id)
    .execute(pool).await?;

    sqlx::query(
        "INSERT INTO customer_emails (customer_id, email, email_normalized, is_primary, source_service) VALUES ($1, $2, $3, TRUE, $4) ON CONFLICT DO NOTHING"
    )
    .bind(cid).bind(email).bind(&email_norm).bind(service_id)
    .execute(pool).await?;

    Ok(cid)
}

pub async fn get_customer_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Customer>> {
    let c = sqlx::query_as::<_, Customer>("SELECT * FROM customers WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(c)
}

pub async fn update_customer_stats_on_payment(
    pool: &PgPool,
    customer_id: Uuid,
    amount: &BigDecimal,
) -> Result<()> {
    sqlx::query(
        "UPDATE customers SET total_spent = total_spent + $1, transaction_count = transaction_count + 1, last_seen_at = NOW() WHERE id = $2"
    )
    .bind(amount)
    .bind(customer_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_customer_stats_on_refund(
    pool: &PgPool,
    customer_id: Uuid,
    refund_amount: &BigDecimal,
) -> Result<()> {
    sqlx::query("UPDATE customers SET total_refunded = total_refunded + $1 WHERE id = $2")
        .bind(refund_amount)
        .bind(customer_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn block_customer(pool: &PgPool, id: Uuid, reason: &str) -> Result<()> {
    sqlx::query("UPDATE customers SET is_blocked = TRUE, block_reason = $1 WHERE id = $2")
        .bind(reason).bind(id).execute(pool).await?;
    Ok(())
}

pub async fn unblock_customer(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query("UPDATE customers SET is_blocked = FALSE, block_reason = NULL WHERE id = $1")
        .bind(id).execute(pool).await?;
    Ok(())
}

pub async fn search_customers(
    pool: &PgPool,
    query: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<Customer>> {
    let customers = sqlx::query_as::<_, Customer>(
        r#"SELECT DISTINCT c.* FROM customers c
        LEFT JOIN customer_emails ce ON ce.customer_id = c.id
        LEFT JOIN customer_phones cp ON cp.customer_id = c.id
        WHERE c.canonical_name ILIKE $1
           OR ce.email_normalized ILIKE $1
           OR cp.phone_normalized LIKE $1
        ORDER BY c.last_seen_at DESC
        LIMIT $2 OFFSET $3"#
    )
    .bind(format!("%{}%", query))
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(customers)
}

pub async fn list_customers(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<Customer>> {
    let customers = sqlx::query_as::<_, Customer>(
        "SELECT * FROM customers ORDER BY last_seen_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(customers)
}
