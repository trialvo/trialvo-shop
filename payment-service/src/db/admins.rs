use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Admin {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub display_name: Option<String>,
    pub role: String,
    pub totp_secret_encrypted: Option<Vec<u8>>,
    pub is_2fa_enabled: bool,
    pub backup_codes: Option<Vec<String>>,
    pub failed_login_count: i16,
    pub locked_until: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub last_login_ip: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn create_admin(
    pool: &PgPool,
    email: &str,
    password_hash: &str,
    display_name: Option<&str>,
    role: &str,
) -> Result<Admin> {
    let admin = sqlx::query_as::<_, Admin>(
        "INSERT INTO admins (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(email)
    .bind(password_hash)
    .bind(display_name)
    .bind(role)
    .fetch_one(pool)
    .await?;
    Ok(admin)
}

pub async fn get_admin_by_email(pool: &PgPool, email: &str) -> Result<Option<Admin>> {
    let admin = sqlx::query_as::<_, Admin>(
        "SELECT * FROM admins WHERE email = $1 AND is_active = TRUE"
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;
    Ok(admin)
}

pub async fn get_admin_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Admin>> {
    let admin = sqlx::query_as::<_, Admin>("SELECT * FROM admins WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(admin)
}

pub async fn list_admins(pool: &PgPool) -> Result<Vec<Admin>> {
    let admins = sqlx::query_as::<_, Admin>("SELECT * FROM admins ORDER BY created_at ASC")
        .fetch_all(pool)
        .await?;
    Ok(admins)
}

pub async fn increment_failed_login(pool: &PgPool, admin_id: Uuid, max_attempts: i16, lockout_minutes: i64) -> Result<()> {
    sqlx::query(
        r#"UPDATE admins SET
            failed_login_count = failed_login_count + 1,
            locked_until = CASE
                WHEN failed_login_count + 1 >= $1 THEN NOW() + ($2 * interval '1 minute')
                ELSE locked_until
            END
        WHERE id = $3"#
    )
    .bind(max_attempts as i32)
    .bind(lockout_minutes)
    .bind(admin_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn reset_failed_login(pool: &PgPool, admin_id: Uuid, ip: &str) -> Result<()> {
    sqlx::query(
        "UPDATE admins SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = $1 WHERE id = $2"
    )
    .bind(ip)
    .bind(admin_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_totp_secret(
    pool: &PgPool,
    admin_id: Uuid,
    encrypted_secret: &[u8],
    backup_codes: &[String],
) -> Result<()> {
    sqlx::query(
        "UPDATE admins SET totp_secret_encrypted = $1, backup_codes = $2, is_2fa_enabled = TRUE WHERE id = $3"
    )
    .bind(encrypted_secret)
    .bind(backup_codes)
    .bind(admin_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn use_backup_code(pool: &PgPool, admin_id: Uuid, code: &str) -> Result<bool> {
    let row = sqlx::query("SELECT backup_codes FROM admins WHERE id = $1")
        .bind(admin_id)
        .fetch_one(pool)
        .await?;

    let codes: Option<Vec<String>> = row.try_get("backup_codes").unwrap_or(None);

    if let Some(codes) = codes {
        if codes.contains(&code.to_uppercase()) {
            let remaining: Vec<String> = codes.into_iter().filter(|c| c != code).collect();
            sqlx::query("UPDATE admins SET backup_codes = $1 WHERE id = $2")
                .bind(&remaining)
                .bind(admin_id)
                .execute(pool)
                .await?;
            return Ok(true);
        }
    }
    Ok(false)
}

pub async fn update_password(pool: &PgPool, admin_id: Uuid, new_password_hash: &str) -> Result<()> {
    sqlx::query("UPDATE admins SET password_hash = $1 WHERE id = $2")
        .bind(new_password_hash)
        .bind(admin_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Admin Sessions ────────────────────────────────────────────────────────────

pub async fn create_session(
    pool: &PgPool,
    admin_id: Uuid,
    token_hash: &str,
    ip_address: Option<&str>,
    user_agent: Option<&str>,
    session_hours: i64,
) -> Result<Uuid> {
    let expires_at = Utc::now() + chrono::Duration::hours(session_hours);
    let row = sqlx::query(
        r#"INSERT INTO admin_sessions (admin_id, token_hash, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3::inet, $4, $5)
        RETURNING id"#
    )
    .bind(admin_id)
    .bind(token_hash)
    .bind(ip_address)
    .bind(user_agent)
    .bind(expires_at)
    .fetch_one(pool)
    .await?;
    Ok(row.try_get("id")?)
}

pub async fn get_valid_session(pool: &PgPool, token_hash: &str) -> Result<Option<Uuid>> {
    let row = sqlx::query(
        "SELECT admin_id FROM admin_sessions WHERE token_hash = $1 AND expires_at > NOW() AND revoked_at IS NULL"
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| r.try_get("admin_id").unwrap()))
}

pub async fn revoke_session(pool: &PgPool, token_hash: &str) -> Result<()> {
    sqlx::query("UPDATE admin_sessions SET revoked_at = NOW() WHERE token_hash = $1")
        .bind(token_hash)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn revoke_all_sessions(pool: &PgPool, admin_id: Uuid) -> Result<()> {
    sqlx::query("UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = $1 AND revoked_at IS NULL")
        .bind(admin_id)
        .execute(pool)
        .await?;
    Ok(())
}
