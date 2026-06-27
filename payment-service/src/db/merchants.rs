use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MerchantUser {
    pub id: Uuid,
    pub service_id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub display_name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub must_change_password: bool,
    pub last_login_at: Option<DateTime<Utc>>,
    pub last_login_ip: Option<String>,
    pub failed_login_count: i16,
    pub locked_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MerchantSession {
    pub id: Uuid,
    pub merchant_user_id: Uuid,
    pub token_hash: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub expires_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

// ─── Merchant User CRUD ──────────────────────────────────────────────────────

pub async fn create_merchant_user(
    pool: &PgPool,
    service_id: Uuid,
    email: &str,
    password_hash: &str,
    display_name: Option<&str>,
) -> Result<MerchantUser> {
    let user = sqlx::query_as::<_, MerchantUser>(
        r#"INSERT INTO merchant_users (service_id, email, password_hash, display_name, must_change_password)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING *"#
    )
    .bind(service_id)
    .bind(email)
    .bind(password_hash)
    .bind(display_name)
    .fetch_one(pool)
    .await?;
    Ok(user)
}

pub async fn get_merchant_by_email(pool: &PgPool, email: &str) -> Result<Option<MerchantUser>> {
    let user = sqlx::query_as::<_, MerchantUser>(
        "SELECT * FROM merchant_users WHERE email = $1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;
    Ok(user)
}

pub async fn get_merchant_by_id(pool: &PgPool, id: Uuid) -> Result<Option<MerchantUser>> {
    let user = sqlx::query_as::<_, MerchantUser>(
        "SELECT * FROM merchant_users WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(user)
}

pub async fn get_merchant_by_service(pool: &PgPool, service_id: Uuid) -> Result<Option<MerchantUser>> {
    let user = sqlx::query_as::<_, MerchantUser>(
        "SELECT * FROM merchant_users WHERE service_id = $1"
    )
    .bind(service_id)
    .fetch_optional(pool)
    .await?;
    Ok(user)
}

pub async fn list_merchant_users(pool: &PgPool, limit: i64, offset: i64) -> Result<Vec<MerchantUser>> {
    let users = sqlx::query_as::<_, MerchantUser>(
        "SELECT * FROM merchant_users ORDER BY created_at DESC LIMIT $1 OFFSET $2"
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(users)
}

pub async fn update_merchant_password(pool: &PgPool, id: Uuid, password_hash: &str) -> Result<()> {
    sqlx::query(
        "UPDATE merchant_users SET password_hash = $1, must_change_password = FALSE WHERE id = $2"
    )
    .bind(password_hash)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn toggle_merchant_active(pool: &PgPool, id: Uuid, is_active: bool) -> Result<()> {
    sqlx::query("UPDATE merchant_users SET is_active = $1 WHERE id = $2")
        .bind(is_active)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_merchant_login(pool: &PgPool, id: Uuid, ip: Option<&str>) -> Result<()> {
    sqlx::query(
        "UPDATE merchant_users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2"
    )
    .bind(ip)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

// ─── Brute-Force Protection ─────────────────────────────────────────────────

/// Increment failed login count; lock account if max_attempts reached.
pub async fn increment_failed_merchant_login(
    pool: &PgPool,
    id: Uuid,
    max_attempts: i16,
    lockout_minutes: i64,
) -> Result<()> {
    sqlx::query(
        r#"UPDATE merchant_users
        SET failed_login_count = failed_login_count + 1,
            locked_until = CASE
                WHEN (failed_login_count + 1) >= $2
                THEN NOW() + ($3 || ' minutes')::INTERVAL
                ELSE locked_until
            END
        WHERE id = $1"#
    )
    .bind(id)
    .bind(max_attempts)
    .bind(lockout_minutes)
    .execute(pool)
    .await?;
    Ok(())
}

/// Reset failed login count and lockout on successful login.
pub async fn reset_failed_merchant_login(pool: &PgPool, id: Uuid) -> Result<()> {
    sqlx::query(
        "UPDATE merchant_users SET failed_login_count = 0, locked_until = NULL WHERE id = $1"
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

// ─── Merchant Sessions ───────────────────────────────────────────────────────

pub async fn create_merchant_session(
    pool: &PgPool,
    merchant_user_id: Uuid,
    token_hash: &str,
    ip_address: Option<&str>,
    user_agent: Option<&str>,
    expires_at: DateTime<Utc>,
) -> Result<MerchantSession> {
    let session = sqlx::query_as::<_, MerchantSession>(
        r#"INSERT INTO merchant_sessions (merchant_user_id, token_hash, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *"#
    )
    .bind(merchant_user_id)
    .bind(token_hash)
    .bind(ip_address)
    .bind(user_agent)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;
    Ok(session)
}

pub async fn get_valid_merchant_session(pool: &PgPool, token_hash: &str) -> Result<Option<Uuid>> {
    let result: Option<(Uuid,)> = sqlx::query_as(
        "SELECT merchant_user_id FROM merchant_sessions WHERE token_hash = $1 AND expires_at > NOW() AND revoked_at IS NULL"
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await?;
    Ok(result.map(|r| r.0))
}

pub async fn revoke_merchant_session(pool: &PgPool, token_hash: &str) -> Result<()> {
    sqlx::query("UPDATE merchant_sessions SET revoked_at = NOW() WHERE token_hash = $1")
        .bind(token_hash)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn revoke_all_merchant_sessions(pool: &PgPool, merchant_user_id: Uuid) -> Result<()> {
    sqlx::query(
        "UPDATE merchant_sessions SET revoked_at = NOW() WHERE merchant_user_id = $1 AND revoked_at IS NULL"
    )
    .bind(merchant_user_id)
    .execute(pool)
    .await?;
    Ok(())
}
