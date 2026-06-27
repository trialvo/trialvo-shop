use anyhow::Result;
use sqlx::PgPool;
use serde_json::Value;

pub async fn log(
    pool: &PgPool,
    actor_type: &str,
    actor_id: Option<&str>,
    action: &str,
    resource_type: Option<&str>,
    resource_id: Option<&str>,
    old_values: Option<Value>,
    new_values: Option<Value>,
    ip_address: Option<&str>,
    user_agent: Option<&str>,
) -> Result<()> {
    sqlx::query(
        r#"INSERT INTO audit_logs (actor_type, actor_id, action, resource_type, resource_id,
            old_values, new_values, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"#
    )
    .bind(actor_type)
    .bind(actor_id)
    .bind(action)
    .bind(resource_type)
    .bind(resource_id)
    .bind(old_values)
    .bind(new_values)
    .bind(ip_address)
    .bind(user_agent)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_audit_logs(
    pool: &PgPool,
    actor_type: Option<&str>,
    action_prefix: Option<&str>,
    resource_type: Option<&str>,
    limit: i64,
    offset: i64,
) -> Result<Vec<AuditLog>> {
    let logs = sqlx::query_as::<_, AuditLog>(
        r#"SELECT * FROM audit_logs
        WHERE ($1::text IS NULL OR actor_type = $1)
          AND ($2::text IS NULL OR action LIKE $2)
          AND ($3::text IS NULL OR resource_type = $3)
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5"#
    )
    .bind(actor_type)
    .bind(action_prefix.map(|a| format!("{}%", a)))
    .bind(resource_type)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(logs)
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    pub id: i64,
    pub actor_type: String,
    pub actor_id: Option<String>,
    pub action: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub old_values: Option<Value>,
    pub new_values: Option<Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
