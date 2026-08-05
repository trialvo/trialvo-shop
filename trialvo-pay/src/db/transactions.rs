use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub bill_id: Uuid,
    pub eps_transaction_id: Option<String>,
    pub eps_merchant_tx_id: String,
    pub eps_customer_order_id: Option<String>,
    pub eps_redirect_url: Option<String>,
    pub eps_financial_entity: Option<String>,
    pub eps_customer_id: Option<String>,
    pub eps_payment_ref: Option<String>,
    pub eps_transaction_date: Option<String>,
    pub transaction_type_id: i16,
    pub value_a: Option<String>,
    pub value_b: Option<String>,
    pub value_c: Option<String>,
    pub value_d: Option<String>,
    pub amount: BigDecimal,
    pub currency: String,
    pub status: String,
    pub gateway_provider: String,
    pub gateway_response_raw: Option<serde_json::Value>,
    pub gateway_error_code: Option<String>,
    pub gateway_error_message: Option<String>,
    pub client_ip: Option<String>,
    pub user_agent: Option<String>,
    pub initiated_at: DateTime<Utc>,
    pub redirected_at: Option<DateTime<Utc>>,
    pub callback_received_at: Option<DateTime<Utc>>,
    pub verified_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub failed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TransactionEvent {
    pub id: i64,
    pub transaction_id: Uuid,
    pub event_type: String,
    pub old_status: Option<String>,
    pub new_status: Option<String>,
    pub event_data: serde_json::Value,
    pub source: String,
    pub source_ip: Option<String>,
    pub created_at: DateTime<Utc>,
}

const TX_COLUMNS: &str = "id, bill_id, eps_transaction_id, eps_merchant_tx_id, eps_customer_order_id, eps_redirect_url, eps_financial_entity, eps_customer_id, eps_payment_ref, eps_transaction_date, transaction_type_id, value_a, value_b, value_c, value_d, amount, currency, status::text as status, gateway_provider, gateway_response_raw, gateway_error_code, gateway_error_message, client_ip::text as client_ip, user_agent, initiated_at, redirected_at, callback_received_at, verified_at, completed_at, failed_at, created_at, updated_at";

pub const TX_COLUMNS_WITH_ALIAS: &str = "t.id, t.bill_id, t.eps_transaction_id, t.eps_merchant_tx_id, t.eps_customer_order_id, t.eps_redirect_url, t.eps_financial_entity, t.eps_customer_id, t.eps_payment_ref, t.eps_transaction_date, t.transaction_type_id, t.value_a, t.value_b, t.value_c, t.value_d, t.amount, t.currency, t.status::text as status, t.gateway_provider, t.gateway_response_raw, t.gateway_error_code, t.gateway_error_message, t.client_ip::text as client_ip, t.user_agent, t.initiated_at, t.redirected_at, t.callback_received_at, t.verified_at, t.completed_at, t.failed_at, t.created_at, t.updated_at";

pub fn generate_merchant_tx_id() -> String {
    use rand::Rng;
    let ts = Utc::now().timestamp_millis();
    let suffix: u32 = rand::thread_rng().gen_range(100000..999999);
    format!("{}{}", ts, suffix)
}

pub async fn create_transaction(
    pool: &PgPool,
    bill_id: Uuid,
    amount: &BigDecimal,
    bill_token: &str,
    service_slug: &str,
    external_order_id: Option<&str>,
    client_ip: Option<&str>,
    user_agent: Option<&str>,
    transaction_type_id: i16,
) -> Result<Transaction> {
    let merchant_tx_id = generate_merchant_tx_id();

    let tx = sqlx::query_as::<_, Transaction>(
        r#"INSERT INTO transactions (
            bill_id, eps_merchant_tx_id, eps_customer_order_id,
            value_a, value_b, value_c,
            amount, currency, transaction_type_id, client_ip, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'BDT', $8, $9::inet, $10)
        RETURNING id, bill_id, eps_transaction_id, eps_merchant_tx_id, eps_customer_order_id, eps_redirect_url, eps_financial_entity, eps_customer_id, eps_payment_ref, eps_transaction_date, transaction_type_id, value_a, value_b, value_c, value_d, amount, currency, status::text as status, gateway_provider, gateway_response_raw, gateway_error_code, gateway_error_message, client_ip::text as client_ip, user_agent, initiated_at, redirected_at, callback_received_at, verified_at, completed_at, failed_at, created_at, updated_at"#
    )
    .bind(bill_id)
    .bind(&merchant_tx_id)
    .bind(external_order_id)
    .bind(bill_token)
    .bind(service_slug)
    .bind(external_order_id)
    .bind(amount)
    .bind(transaction_type_id)
    .bind(client_ip)
    .bind(user_agent)
    .fetch_one(pool)
    .await?;

    log_event(pool, tx.id, "initiated", None, Some("initiated"), serde_json::json!({}), "system", client_ip).await?;

    Ok(tx)
}

pub async fn update_transaction_after_init(
    pool: &PgPool,
    tx_id: Uuid,
    eps_transaction_id: &str,
    redirect_url: &str,
) -> Result<Transaction> {
    let tx = sqlx::query_as::<_, Transaction>(
        &format!("UPDATE transactions SET eps_transaction_id = $1, eps_redirect_url = $2, status = 'processing', redirected_at = NOW() WHERE id = $3 RETURNING {}", TX_COLUMNS)
    )
    .bind(eps_transaction_id)
    .bind(redirect_url)
    .bind(tx_id)
    .fetch_one(pool)
    .await?;

    log_event(pool, tx_id, "redirected", Some("initiated"), Some("processing"),
        serde_json::json!({"eps_tx": eps_transaction_id}), "system", None).await?;

    Ok(tx)
}

pub async fn update_transaction_from_callback(
    pool: &PgPool,
    tx_id: Uuid,
    status: &str,
    financial_entity: Option<&str>,
    customer_id: Option<&str>,
    payment_ref: Option<&str>,
    transaction_date: Option<&str>,
    raw_response: &serde_json::Value,
    error_code: Option<&str>,
    error_message: Option<&str>,
) -> Result<Transaction> {
    let (completed_at, failed_at) = match status {
        "success" => (Some(Utc::now()), None::<DateTime<Utc>>),
        _ => (None, Some(Utc::now())),
    };

    let tx = sqlx::query_as::<_, Transaction>(
        &format!("UPDATE transactions SET status = $1::transaction_status, eps_financial_entity = $2, eps_customer_id = $3, eps_payment_ref = $4, eps_transaction_date = $5, gateway_response_raw = $6, gateway_error_code = $7, gateway_error_message = $8, callback_received_at = NOW(), verified_at = NOW(), completed_at = $9, failed_at = $10 WHERE id = $11 RETURNING {}", TX_COLUMNS)
    )
    .bind(status)
    .bind(financial_entity)
    .bind(customer_id)
    .bind(payment_ref)
    .bind(transaction_date)
    .bind(raw_response)
    .bind(error_code)
    .bind(error_message)
    .bind(completed_at)
    .bind(failed_at)
    .bind(tx_id)
    .fetch_one(pool)
    .await?;

    log_event(pool, tx_id, "callback_verified", Some("processing"), Some(status),
        serde_json::json!({"financial_entity": financial_entity}), "eps_callback", None).await?;

    Ok(tx)
}

/// Persist callback receipt without changing payment status (used when CheckStatus fails).
pub async fn record_callback_receipt(
    pool: &PgPool,
    tx_id: Uuid,
    eps_transaction_id: Option<&str>,
    financial_entity: Option<&str>,
    customer_id: Option<&str>,
    payment_ref: Option<&str>,
    transaction_date: Option<&str>,
    raw_response: &serde_json::Value,
) -> Result<()> {
    sqlx::query(
        r#"UPDATE transactions SET
            eps_transaction_id = COALESCE($2, eps_transaction_id),
            eps_financial_entity = COALESCE($3, eps_financial_entity),
            eps_customer_id = COALESCE($4, eps_customer_id),
            eps_payment_ref = COALESCE($5, eps_payment_ref),
            eps_transaction_date = COALESCE($6, eps_transaction_date),
            gateway_response_raw = COALESCE($7, gateway_response_raw),
            callback_received_at = COALESCE(callback_received_at, NOW()),
            updated_at = NOW()
        WHERE id = $1"#
    )
    .bind(tx_id)
    .bind(eps_transaction_id)
    .bind(financial_entity)
    .bind(customer_id)
    .bind(payment_ref)
    .bind(transaction_date)
    .bind(raw_response)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_eps_transaction_id(pool: &PgPool, tx_id: Uuid, eps_transaction_id: &str) -> Result<()> {
    sqlx::query(
        "UPDATE transactions SET eps_transaction_id = $2, updated_at = NOW() WHERE id = $1"
    )
    .bind(tx_id)
    .bind(eps_transaction_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_transaction_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Transaction>> {
    let tx = sqlx::query_as::<_, Transaction>(&format!("SELECT {} FROM transactions WHERE id = $1", TX_COLUMNS))
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(tx)
}

pub async fn get_transaction_by_merchant_tx_id(pool: &PgPool, merchant_tx_id: &str) -> Result<Option<Transaction>> {
    let tx = sqlx::query_as::<_, Transaction>(
        &format!("SELECT {} FROM transactions WHERE eps_merchant_tx_id = $1", TX_COLUMNS)
    )
    .bind(merchant_tx_id)
    .fetch_optional(pool)
    .await?;
    Ok(tx)
}

pub async fn get_transaction_by_bill_id(pool: &PgPool, bill_id: Uuid) -> Result<Option<Transaction>> {
    let tx = sqlx::query_as::<_, Transaction>(
        &format!("SELECT {} FROM transactions WHERE bill_id = $1 ORDER BY created_at DESC LIMIT 1", TX_COLUMNS)
    )
    .bind(bill_id)
    .fetch_optional(pool)
    .await?;
    Ok(tx)
}

/// Latest in-flight transaction for a bill (processing with redirect, or recent initiated).
pub async fn get_reusable_eps_transaction(pool: &PgPool, bill_id: Uuid) -> Result<Option<Transaction>> {
    let tx = sqlx::query_as::<_, Transaction>(
        &format!(
            "SELECT {} FROM transactions \
             WHERE bill_id = $1 \
               AND status IN ('processing', 'initiated') \
               AND created_at > NOW() - INTERVAL '30 minutes' \
             ORDER BY created_at DESC LIMIT 1",
            TX_COLUMNS
        )
    )
    .bind(bill_id)
    .fetch_optional(pool)
    .await?;
    Ok(tx)
}

/// Callbacks received but still waiting for a successful EPS CheckStatus.
pub async fn list_pending_callback_verifications(pool: &PgPool, limit: i64) -> Result<Vec<Transaction>> {
    let rows = sqlx::query_as::<_, Transaction>(
        &format!(
            "SELECT {} FROM transactions \
             WHERE callback_received_at IS NOT NULL \
               AND status IN ('processing', 'initiated') \
               AND created_at > NOW() - INTERVAL '7 days' \
             ORDER BY callback_received_at ASC \
             LIMIT $1",
            TX_COLUMNS
        )
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn mark_transaction_failed(
    pool: &PgPool,
    tx_id: Uuid,
    error_code: &str,
    error_message: &str,
) -> Result<()> {
    sqlx::query(
        r#"UPDATE transactions SET
            status = 'failed',
            gateway_error_code = $2,
            gateway_error_message = $3,
            failed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status IN ('initiated', 'processing')"#
    )
    .bind(tx_id)
    .bind(error_code)
    .bind(error_message)
    .execute(pool)
    .await?;
    let _ = log_event(
        pool, tx_id, "init_failed",
        Some("initiated"), Some("failed"),
        serde_json::json!({"error_code": error_code, "error": error_message}),
        "system", None,
    ).await;
    Ok(())
}

pub async fn get_transaction_events(pool: &PgPool, tx_id: Uuid) -> Result<Vec<TransactionEvent>> {
    let events = sqlx::query_as::<_, TransactionEvent>(
        "SELECT id, transaction_id, event_type, old_status::text as old_status, new_status::text as new_status, event_data, source, source_ip::text as source_ip, created_at FROM transaction_events WHERE transaction_id = $1 ORDER BY created_at ASC"
    )
    .bind(tx_id)
    .fetch_all(pool)
    .await?;
    Ok(events)
}

pub async fn list_transactions(
    pool: &PgPool,
    service_id: Option<Uuid>,
    status: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Transaction>> {
    let txs = sqlx::query_as::<_, Transaction>(
        &format!("SELECT {} FROM transactions t JOIN bills b ON b.id = t.bill_id WHERE ($1::uuid IS NULL OR b.service_id = $1) AND ($2::text IS NULL OR t.status = $2::transaction_status) ORDER BY t.created_at DESC LIMIT $3 OFFSET $4", TX_COLUMNS_WITH_ALIAS)
    )
    .bind(service_id)
    .bind(status)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(txs)
}

/// Admin list with bill customer fields so Customer column can be filled.
pub async fn list_transactions_enriched(
    pool: &PgPool,
    service_id: Option<Uuid>,
    status: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<Vec<serde_json::Value>> {
    let rows = sqlx::query(
        &format!(
            "SELECT {}, b.customer_name, b.customer_email, b.customer_phone \
             FROM transactions t JOIN bills b ON b.id = t.bill_id \
             WHERE ($1::uuid IS NULL OR b.service_id = $1) \
               AND ($2::text IS NULL OR t.status = $2::transaction_status) \
             ORDER BY t.created_at DESC LIMIT $3 OFFSET $4",
            TX_COLUMNS_WITH_ALIAS
        )
    )
    .bind(service_id)
    .bind(status)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    let mut out = Vec::with_capacity(rows.len());
    for row in rows {
        use sqlx::Row;
        let tx = Transaction {
            id: row.try_get("id")?,
            bill_id: row.try_get("bill_id")?,
            eps_transaction_id: row.try_get("eps_transaction_id")?,
            eps_merchant_tx_id: row.try_get("eps_merchant_tx_id")?,
            eps_customer_order_id: row.try_get("eps_customer_order_id")?,
            eps_redirect_url: row.try_get("eps_redirect_url")?,
            eps_financial_entity: row.try_get("eps_financial_entity")?,
            eps_customer_id: row.try_get("eps_customer_id")?,
            eps_payment_ref: row.try_get("eps_payment_ref")?,
            eps_transaction_date: row.try_get("eps_transaction_date")?,
            transaction_type_id: row.try_get("transaction_type_id")?,
            value_a: row.try_get("value_a")?,
            value_b: row.try_get("value_b")?,
            value_c: row.try_get("value_c")?,
            value_d: row.try_get("value_d")?,
            amount: row.try_get("amount")?,
            currency: row.try_get("currency")?,
            status: row.try_get("status")?,
            gateway_provider: row.try_get("gateway_provider")?,
            gateway_response_raw: row.try_get("gateway_response_raw")?,
            gateway_error_code: row.try_get("gateway_error_code")?,
            gateway_error_message: row.try_get("gateway_error_message")?,
            client_ip: row.try_get("client_ip")?,
            user_agent: row.try_get("user_agent")?,
            initiated_at: row.try_get("initiated_at")?,
            redirected_at: row.try_get("redirected_at")?,
            callback_received_at: row.try_get("callback_received_at")?,
            verified_at: row.try_get("verified_at")?,
            completed_at: row.try_get("completed_at")?,
            failed_at: row.try_get("failed_at")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        };
        let customer_name: Option<String> = row.try_get("customer_name")?;
        let customer_email: Option<String> = row.try_get("customer_email")?;
        let customer_phone: Option<String> = row.try_get("customer_phone")?;

        let mut value = serde_json::to_value(&tx)?;
        if let Some(obj) = value.as_object_mut() {
            obj.insert("customer_name".into(), serde_json::json!(customer_name));
            obj.insert("customer_email".into(), serde_json::json!(customer_email));
            obj.insert("customer_phone".into(), serde_json::json!(customer_phone));
            // Display helpers for admin table when EPS callback fields are empty
            if obj.get("eps_financial_entity").and_then(|v| v.as_str()).unwrap_or("").is_empty() {
                // leave as-is; UI falls back
            }
        }
        out.push(value);
    }
    Ok(out)
}

pub async fn count_transactions(
    pool: &PgPool,
    service_id: Option<Uuid>,
    status: Option<String>,
) -> Result<i64> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transactions t JOIN bills b ON b.id = t.bill_id WHERE ($1::uuid IS NULL OR b.service_id = $1) AND ($2::text IS NULL OR t.status = $2::transaction_status)"
    )
    .bind(service_id)
    .bind(status)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn log_event(
    pool: &PgPool,
    transaction_id: Uuid,
    event_type: &str,
    old_status: Option<&str>,
    new_status: Option<&str>,
    event_data: serde_json::Value,
    source: &str,
    source_ip: Option<&str>,
) -> Result<()> {
    sqlx::query(
        r#"INSERT INTO transaction_events (transaction_id, event_type, old_status, new_status, event_data, source, source_ip)
        VALUES ($1, $2, $3::transaction_status, $4::transaction_status, $5, $6, $7::inet)"#
    )
    .bind(transaction_id)
    .bind(event_type)
    .bind(old_status)
    .bind(new_status)
    .bind(event_data)
    .bind(source)
    .bind(source_ip)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_events_for_transaction(pool: &PgPool, transaction_id: Uuid) -> Result<Vec<TransactionEvent>> {
    let events = sqlx::query_as::<_, TransactionEvent>(
        "SELECT id, transaction_id, event_type, old_status::text as old_status, new_status::text as new_status, event_data, source, source_ip::text as source_ip, created_at FROM transaction_events WHERE transaction_id = $1 ORDER BY created_at ASC"
    )
    .bind(transaction_id)
    .fetch_all(pool)
    .await?;
    Ok(events)
}

/// Hard-delete a transaction and its events (CASCADE handles events automatically).
pub async fn delete_transaction(pool: &PgPool, id: Uuid) -> Result<bool> {
    let result = sqlx::query("DELETE FROM transactions WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}
