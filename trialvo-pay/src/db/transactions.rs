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

const TX_COLUMNS_WITH_ALIAS: &str = "t.id, t.bill_id, t.eps_transaction_id, t.eps_merchant_tx_id, t.eps_customer_order_id, t.eps_redirect_url, t.eps_financial_entity, t.eps_customer_id, t.eps_payment_ref, t.eps_transaction_date, t.transaction_type_id, t.value_a, t.value_b, t.value_c, t.value_d, t.amount, t.currency, t.status::text as status, t.gateway_provider, t.gateway_response_raw, t.gateway_error_code, t.gateway_error_message, t.client_ip::text as client_ip, t.user_agent, t.initiated_at, t.redirected_at, t.callback_received_at, t.verified_at, t.completed_at, t.failed_at, t.created_at, t.updated_at";

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
