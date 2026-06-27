use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use uuid::Uuid;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConfigEntry {
    pub id: i32,
    pub category: String,
    pub key_name: String,
    pub value: String,
    pub value_type: String,
    pub description: Option<String>,
    pub is_secret: bool,
    pub is_active: bool,
}

pub async fn get_config(pool: &PgPool, category: &str, key: &str) -> Result<Option<String>> {
    let row = sqlx::query(
        "SELECT value FROM system_config WHERE category = $1 AND key_name = $2 AND is_active = TRUE"
    )
    .bind(category)
    .bind(key)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| r.try_get::<String, _>("value").unwrap_or_default()))
}

pub async fn get_config_required(pool: &PgPool, category: &str, key: &str) -> Result<String> {
    get_config(pool, category, key).await?.ok_or_else(|| {
        anyhow::anyhow!("Required config '{}:{}' not found", category, key)
    })
}

pub async fn get_config_int(pool: &PgPool, category: &str, key: &str, default: i64) -> Result<i64> {
    let val = get_config(pool, category, key).await?;
    Ok(val.and_then(|v| v.parse().ok()).unwrap_or(default))
}

pub async fn get_config_bool(pool: &PgPool, category: &str, key: &str, default: bool) -> Result<bool> {
    let val = get_config(pool, category, key).await?;
    Ok(val.map(|v| v == "true" || v == "1").unwrap_or(default))
}

pub async fn get_all_config_by_category(pool: &PgPool, category: &str) -> Result<HashMap<String, ConfigEntry>> {
    let entries = sqlx::query_as::<_, ConfigEntry>(
        "SELECT * FROM system_config WHERE category = $1 AND is_active = TRUE"
    )
    .bind(category)
    .fetch_all(pool)
    .await?;

    Ok(entries.into_iter().map(|e| (e.key_name.clone(), e)).collect())
}

pub async fn set_config(
    pool: &PgPool,
    category: &str,
    key: &str,
    value: &str,
    updated_by: Option<Uuid>,
) -> Result<()> {
    sqlx::query(
        "UPDATE system_config SET value = $1, updated_by = $2, updated_at = NOW() WHERE category = $3 AND key_name = $4"
    )
    .bind(value)
    .bind(updated_by)
    .bind(category)
    .bind(key)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_all_config(pool: &PgPool) -> Result<Vec<ConfigEntry>> {
    let entries = sqlx::query_as::<_, ConfigEntry>(
        "SELECT * FROM system_config ORDER BY category, key_name"
    )
    .fetch_all(pool)
    .await?;
    Ok(entries)
}

pub async fn get_eps_mode(pool: &PgPool) -> Result<String> {
    get_config(pool, "eps", "mode").await?.ok_or_else(|| anyhow::anyhow!("EPS mode not configured"))
}

pub struct EpsCredentials {
    pub base_url: String,
    pub merchant_id: String,
    pub store_id: String,
    pub username: String,
    pub password: String,
    pub hash_key: String,
    pub mode: String,
}

pub async fn get_eps_credentials(pool: &PgPool, master_key: &str) -> Result<EpsCredentials> {
    let mode = get_eps_mode(pool).await?;
    let pfx = &mode;

    let base_url = get_config_required(pool, "eps", &format!("{}_base_url", pfx)).await?;
    let merchant_id = get_config_required(pool, "eps", &format!("{}_merchant_id", pfx)).await?;
    let store_id = get_config_required(pool, "eps", &format!("{}_store_id", pfx)).await?;
    let enc_username = get_config_required(pool, "eps", &format!("{}_username", pfx)).await?;
    let enc_password = get_config_required(pool, "eps", &format!("{}_password", pfx)).await?;
    let enc_hash_key = get_config_required(pool, "eps", &format!("{}_hash_key", pfx)).await?;

    let username = if enc_username.is_empty() {
        String::new()
    } else {
        crate::crypto::aes::decrypt(master_key, &enc_username)?
    };
    let password = if enc_password.is_empty() {
        String::new()
    } else {
        crate::crypto::aes::decrypt(master_key, &enc_password)?
    };
    let hash_key = if enc_hash_key.is_empty() {
        String::new()
    } else {
        crate::crypto::aes::decrypt(master_key, &enc_hash_key)?
    };

    Ok(EpsCredentials { base_url, merchant_id, store_id, username, password, hash_key, mode })
}
