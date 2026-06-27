use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Service {
    pub id: Uuid,
    pub slug: String,
    pub display_name: String,
    pub description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub logo_url: Option<String>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub daily_tx_limit: Option<i32>,
    pub monthly_tx_limit: Option<i32>,
    pub max_single_amount: Option<BigDecimal>,
    pub min_single_amount: Option<BigDecimal>,
    pub commission_rate: BigDecimal,
    pub commission_type: String,
    pub is_active: bool,
    pub is_sandbox: bool,
    pub meta: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateServiceInput {
    pub slug: String,
    pub display_name: String,
    pub description: Option<String>,
    pub contact_email: Option<String>,
    pub contact_phone: Option<String>,
    pub logo_url: Option<String>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub is_sandbox: bool,
    pub commission_rate: Option<BigDecimal>,
    pub commission_type: Option<String>,
    pub meta: Option<serde_json::Value>,
}

pub async fn create_service(pool: &PgPool, input: CreateServiceInput) -> Result<Service> {
    let commission_rate = input.commission_rate.unwrap_or_else(|| BigDecimal::from(25) / BigDecimal::from(10)); // default 2.5
    let commission_type = input.commission_type.unwrap_or_else(|| "percentage".to_string());
    let service = sqlx::query_as::<_, Service>(
        r#"INSERT INTO services (slug, display_name, description, contact_email, contact_phone,
            logo_url, success_url, fail_url, cancel_url, is_sandbox, commission_rate, commission_type, meta)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *"#
    )
    .bind(&input.slug)
    .bind(&input.display_name)
    .bind(&input.description)
    .bind(&input.contact_email)
    .bind(&input.contact_phone)
    .bind(&input.logo_url)
    .bind(&input.success_url)
    .bind(&input.fail_url)
    .bind(&input.cancel_url)
    .bind(input.is_sandbox)
    .bind(&commission_rate)
    .bind(&commission_type)
    .bind(input.meta.unwrap_or(serde_json::json!({})))
    .fetch_one(pool)
    .await?;
    Ok(service)
}

pub async fn get_service_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Service>> {
    let service = sqlx::query_as::<_, Service>("SELECT * FROM services WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(service)
}

pub async fn get_service_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Service>> {
    let service = sqlx::query_as::<_, Service>("SELECT * FROM services WHERE slug = $1")
        .bind(slug)
        .fetch_optional(pool)
        .await?;
    Ok(service)
}

pub async fn list_services(
    pool: &PgPool,
    is_active: Option<bool>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Service>> {
    let services = match is_active {
        Some(active) => sqlx::query_as::<_, Service>(
            "SELECT * FROM services WHERE is_active = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(active)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?,
        None => sqlx::query_as::<_, Service>(
            "SELECT * FROM services ORDER BY created_at DESC LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?,
    };
    Ok(services)
}

pub async fn toggle_service_active(pool: &PgPool, id: Uuid, is_active: bool) -> Result<Service> {
    let service = sqlx::query_as::<_, Service>(
        "UPDATE services SET is_active = $1 WHERE id = $2 RETURNING *"
    )
    .bind(is_active)
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(service)
}

// ─── Service Keys ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ServiceKey {
    pub id: Uuid,
    pub service_id: Uuid,
    pub key_hash: String,
    pub encrypted_key: Vec<u8>,
    pub key_prefix: String,
    pub is_primary: bool,
    pub grace_until: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub revoked_at: Option<DateTime<Utc>>,
    pub revoked_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
}

pub async fn create_service_key(
    pool: &PgPool,
    service_id: Uuid,
    key_hash: &str,
    encrypted_key: &[u8],
    key_prefix: &str,
) -> Result<ServiceKey> {
    sqlx::query(
        "UPDATE service_keys SET is_primary = FALSE WHERE service_id = $1 AND is_primary = TRUE"
    )
    .bind(service_id)
    .execute(pool)
    .await?;

    let key = sqlx::query_as::<_, ServiceKey>(
        r#"INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING *"#
    )
    .bind(service_id)
    .bind(key_hash)
    .bind(encrypted_key)
    .bind(key_prefix)
    .fetch_one(pool)
    .await?;
    Ok(key)
}

pub async fn get_active_keys_by_service(pool: &PgPool, service_id: Uuid) -> Result<Vec<ServiceKey>> {
    let keys = sqlx::query_as::<_, ServiceKey>(
        "SELECT * FROM service_keys WHERE service_id = $1 AND is_active = TRUE ORDER BY is_primary DESC, created_at DESC"
    )
    .bind(service_id)
    .fetch_all(pool)
    .await?;
    Ok(keys)
}

pub async fn find_key_by_hash(pool: &PgPool, key_hash: &str) -> Result<Option<ServiceKey>> {
    let key = sqlx::query_as::<_, ServiceKey>(
        "SELECT * FROM service_keys WHERE key_hash = $1 AND is_active = TRUE"
    )
    .bind(key_hash)
    .fetch_optional(pool)
    .await?;
    Ok(key)
}

pub async fn get_key_by_id(pool: &PgPool, key_id: Uuid) -> Result<Option<ServiceKey>> {
    let key = sqlx::query_as::<_, ServiceKey>(
        "SELECT * FROM service_keys WHERE id = $1 AND is_active = TRUE"
    )
    .bind(key_id)
    .fetch_optional(pool)
    .await?;
    Ok(key)
}

pub async fn update_key_last_used(pool: &PgPool, key_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE service_keys SET last_used_at = NOW() WHERE id = $1")
        .bind(key_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn rotate_service_key(
    pool: &PgPool,
    old_key_id: Uuid,
    grace_hours: i64,
    new_key_hash: &str,
    new_encrypted_key: &[u8],
    new_key_prefix: &str,
) -> Result<ServiceKey> {
    let grace_until = Utc::now() + chrono::Duration::hours(grace_hours);

    sqlx::query(
        "UPDATE service_keys SET is_primary = FALSE, grace_until = $1 WHERE id = $2"
    )
    .bind(grace_until)
    .bind(old_key_id)
    .execute(pool)
    .await?;

    let old_service_id: Uuid = sqlx::query_scalar(
        "SELECT service_id FROM service_keys WHERE id = $1"
    )
    .bind(old_key_id)
    .fetch_one(pool)
    .await?;

    let new_key = sqlx::query_as::<_, ServiceKey>(
        r#"INSERT INTO service_keys (service_id, key_hash, encrypted_key, key_prefix, is_primary)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING *"#
    )
    .bind(old_service_id)
    .bind(new_key_hash)
    .bind(new_encrypted_key)
    .bind(new_key_prefix)
    .fetch_one(pool)
    .await?;

    Ok(new_key)
}

pub async fn revoke_service_key(pool: &PgPool, key_id: Uuid, reason: &str) -> Result<()> {
    sqlx::query(
        "UPDATE service_keys SET is_active = FALSE, is_primary = FALSE, revoked_at = NOW(), revoked_reason = $1 WHERE id = $2"
    )
    .bind(reason)
    .bind(key_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn cleanup_expired_grace_keys(pool: &PgPool) -> Result<u64> {
    let result = sqlx::query(
        "UPDATE service_keys SET is_active = FALSE WHERE grace_until IS NOT NULL AND grace_until < NOW() AND is_active = TRUE"
    )
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}
