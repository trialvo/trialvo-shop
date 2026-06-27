use anyhow::Result;
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Bill {
    pub id: Uuid,
    pub bill_token: String,
    pub service_id: Uuid,
    pub customer_id: Option<Uuid>,
    pub external_order_id: Option<String>,
    pub external_subscription_id: Option<String>,
    pub external_invoice_id: Option<String>,
    pub payment_type: String,
    pub currency: String,
    pub subtotal: BigDecimal,
    pub total_discount: BigDecimal,
    pub tax_amount: BigDecimal,
    pub shipping_amount: BigDecimal,
    pub final_amount: BigDecimal,
    pub customer_name: Option<String>,
    pub customer_email: Option<String>,
    pub customer_phone: Option<String>,
    pub customer_address: Option<String>,
    pub customer_address2: Option<String>,
    pub customer_city: Option<String>,
    pub customer_state: Option<String>,
    pub customer_postcode: Option<String>,
    pub customer_country: Option<String>,
    pub shipment_name: Option<String>,
    pub shipment_address: Option<String>,
    pub shipment_address2: Option<String>,
    pub shipment_city: Option<String>,
    pub shipment_state: Option<String>,
    pub shipment_postcode: Option<String>,
    pub shipment_country: Option<String>,
    pub shipment_method: Option<String>,
    pub subscription_tier: Option<String>,
    pub subscription_period: Option<String>,
    pub subscription_cost: Option<BigDecimal>,
    pub status: String,
    pub expires_at: DateTime<Utc>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub client_ip: Option<String>,
    pub user_agent: Option<String>,
    pub service_meta: serde_json::Value,
    pub internal_notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub paid_at: Option<DateTime<Utc>>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub expired_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BillItem {
    pub id: Uuid,
    pub bill_id: Uuid,
    pub external_product_id: Option<String>,
    pub product_name: String,
    pub product_category: Option<String>,
    pub product_profile: Option<String>,
    pub quantity: i32,
    pub unit_buying_price: Option<BigDecimal>,
    pub unit_selling_price: BigDecimal,
    pub unit_discount: BigDecimal,
    pub unit_final_price: BigDecimal,
    pub line_total: BigDecimal,
    pub meta: serde_json::Value,
    pub serial: i16,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBillInput {
    pub service_id: Uuid,
    pub customer_id: Option<Uuid>,
    pub external_order_id: Option<String>,
    pub external_subscription_id: Option<String>,
    pub external_invoice_id: Option<String>,
    pub payment_type: String,
    pub currency: Option<String>,
    pub subtotal: BigDecimal,
    pub total_discount: Option<BigDecimal>,
    pub tax_amount: Option<BigDecimal>,
    pub shipping_amount: Option<BigDecimal>,
    pub final_amount: BigDecimal,
    pub customer_name: String,
    pub customer_email: String,
    pub customer_phone: String,
    pub customer_address: String,
    pub customer_address2: Option<String>,
    pub customer_city: String,
    pub customer_state: String,
    pub customer_postcode: String,
    pub customer_country: Option<String>,
    pub shipment_name: Option<String>,
    pub shipment_address: Option<String>,
    pub shipment_address2: Option<String>,
    pub shipment_city: Option<String>,
    pub shipment_state: Option<String>,
    pub shipment_postcode: Option<String>,
    pub shipment_country: Option<String>,
    pub shipment_method: Option<String>,
    pub subscription_tier: Option<String>,
    pub subscription_period: Option<String>,
    pub subscription_cost: Option<BigDecimal>,
    pub success_url: Option<String>,
    pub fail_url: Option<String>,
    pub cancel_url: Option<String>,
    pub client_ip: Option<String>,
    pub user_agent: Option<String>,
    pub service_meta: Option<serde_json::Value>,
    pub items: Vec<CreateBillItemInput>,
    pub expiry_minutes: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBillItemInput {
    pub external_product_id: Option<String>,
    pub product_name: String,
    pub product_category: Option<String>,
    pub product_profile: Option<String>,
    pub quantity: i32,
    pub unit_buying_price: Option<BigDecimal>,
    pub unit_selling_price: BigDecimal,
    pub unit_discount: Option<BigDecimal>,
    pub unit_final_price: BigDecimal,
    pub meta: Option<serde_json::Value>,
}

const BILL_COLUMNS: &str = "id, bill_token, service_id, customer_id, external_order_id, external_subscription_id, external_invoice_id, payment_type::text as payment_type, currency, subtotal, total_discount, tax_amount, shipping_amount, final_amount, customer_name, customer_email, customer_phone, customer_address, customer_address2, customer_city, customer_state, customer_postcode, customer_country, shipment_name, shipment_address, shipment_address2, shipment_city, shipment_state, shipment_postcode, shipment_country, shipment_method, subscription_tier, subscription_period, subscription_cost, status::text as status, expires_at, success_url, fail_url, cancel_url, client_ip::text as client_ip, user_agent, service_meta, internal_notes, created_at, updated_at, paid_at, cancelled_at, expired_at";

pub fn generate_bill_token() -> String {
    use rand::distributions::Alphanumeric;
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let token: String = (0..48).map(|_| rng.sample(Alphanumeric) as char).collect();
    format!("pvb_{}", token)
}

pub async fn create_bill(pool: &PgPool, input: CreateBillInput) -> Result<Bill> {
    let bill_token = generate_bill_token();
    let expires_at = Utc::now() + chrono::Duration::minutes(input.expiry_minutes);
    let zero = BigDecimal::from(0);

    let bill = sqlx::query_as::<_, Bill>(
        r#"INSERT INTO bills (
            bill_token, service_id, customer_id, external_order_id, external_subscription_id,
            external_invoice_id, payment_type, currency, subtotal, total_discount,
            tax_amount, shipping_amount, final_amount,
            customer_name, customer_email, customer_phone, customer_address, customer_address2,
            customer_city, customer_state, customer_postcode, customer_country,
            shipment_name, shipment_address, shipment_address2, shipment_city,
            shipment_state, shipment_postcode, shipment_country, shipment_method,
            subscription_tier, subscription_period, subscription_cost,
            success_url, fail_url, cancel_url, client_ip, user_agent, service_meta,
            expires_at
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7::payment_type, $8, $9, $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19, $20, $21, $22,
            $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37::inet, $38, $39, $40
        )
        RETURNING id, bill_token, service_id, customer_id, external_order_id, external_subscription_id,
            external_invoice_id, payment_type::text as payment_type, currency, subtotal, total_discount,
            tax_amount, shipping_amount, final_amount,
            customer_name, customer_email, customer_phone, customer_address, customer_address2,
            customer_city, customer_state, customer_postcode, customer_country,
            shipment_name, shipment_address, shipment_address2, shipment_city,
            shipment_state, shipment_postcode, shipment_country, shipment_method,
            subscription_tier, subscription_period, subscription_cost,
            status::text as status, expires_at, success_url, fail_url, cancel_url, client_ip::text as client_ip,
            user_agent, service_meta, internal_notes, created_at, updated_at,
            paid_at, cancelled_at, expired_at"#
    )
    .bind(&bill_token)
    .bind(input.service_id)
    .bind(input.customer_id)
    .bind(&input.external_order_id)
    .bind(&input.external_subscription_id)
    .bind(&input.external_invoice_id)
    .bind(&input.payment_type)
    .bind(input.currency.as_deref().unwrap_or("BDT"))
    .bind(&input.subtotal)
    .bind(input.total_discount.as_ref().unwrap_or(&zero))
    .bind(input.tax_amount.as_ref().unwrap_or(&zero))
    .bind(input.shipping_amount.as_ref().unwrap_or(&zero))
    .bind(&input.final_amount)
    .bind(&input.customer_name)
    .bind(&input.customer_email)
    .bind(&input.customer_phone)
    .bind(&input.customer_address)
    .bind(&input.customer_address2)
    .bind(&input.customer_city)
    .bind(&input.customer_state)
    .bind(&input.customer_postcode)
    .bind(input.customer_country.as_deref().unwrap_or("BD"))
    .bind(&input.shipment_name)
    .bind(&input.shipment_address)
    .bind(&input.shipment_address2)
    .bind(&input.shipment_city)
    .bind(&input.shipment_state)
    .bind(&input.shipment_postcode)
    .bind(&input.shipment_country)
    .bind(&input.shipment_method)
    .bind(&input.subscription_tier)
    .bind(&input.subscription_period)
    .bind(&input.subscription_cost)
    .bind(&input.success_url)
    .bind(&input.fail_url)
    .bind(&input.cancel_url)
    .bind(&input.client_ip)
    .bind(&input.user_agent)
    .bind(input.service_meta.as_ref().unwrap_or(&serde_json::json!({})))
    .bind(expires_at)
    .fetch_one(pool)
    .await?;

    for (idx, item) in input.items.iter().enumerate() {
        let zero2 = BigDecimal::from(0);
        let line_total = item.unit_final_price.clone() * BigDecimal::from(item.quantity);
        sqlx::query(
            r#"INSERT INTO bill_items (
                bill_id, external_product_id, product_name, product_category, product_profile,
                quantity, unit_buying_price, unit_selling_price, unit_discount, unit_final_price,
                line_total, meta, serial
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)"#
        )
        .bind(bill.id)
        .bind(&item.external_product_id)
        .bind(&item.product_name)
        .bind(&item.product_category)
        .bind(&item.product_profile)
        .bind(item.quantity)
        .bind(&item.unit_buying_price)
        .bind(&item.unit_selling_price)
        .bind(item.unit_discount.as_ref().unwrap_or(&zero2))
        .bind(&item.unit_final_price)
        .bind(&line_total)
        .bind(item.meta.as_ref().unwrap_or(&serde_json::json!({})))
        .bind((idx + 1) as i16)
        .execute(pool)
        .await?;
    }

    Ok(bill)
}

pub async fn get_bill_by_token(pool: &PgPool, token: &str) -> Result<Option<Bill>> {
    let bill = sqlx::query_as::<_, Bill>(&format!("SELECT {} FROM bills WHERE bill_token = $1", BILL_COLUMNS))
        .bind(token)
        .fetch_optional(pool)
        .await?;
    Ok(bill)
}

pub async fn get_bill_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Bill>> {
    let bill = sqlx::query_as::<_, Bill>(&format!("SELECT {} FROM bills WHERE id = $1", BILL_COLUMNS))
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(bill)
}

pub async fn get_bill_items(pool: &PgPool, bill_id: Uuid) -> Result<Vec<BillItem>> {
    let items = sqlx::query_as::<_, BillItem>(
        "SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY serial ASC"
    )
    .bind(bill_id)
    .fetch_all(pool)
    .await?;
    Ok(items)
}

pub async fn update_bill_status(pool: &PgPool, bill_id: Uuid, status: &str) -> Result<()> {
    match status {
        "paid" => {
            sqlx::query("UPDATE bills SET status = $1::bill_status, paid_at = NOW() WHERE id = $2")
                .bind(status).bind(bill_id).execute(pool).await?;
        }
        "cancelled" => {
            sqlx::query("UPDATE bills SET status = $1::bill_status, cancelled_at = NOW() WHERE id = $2")
                .bind(status).bind(bill_id).execute(pool).await?;
        }
        "expired" => {
            sqlx::query("UPDATE bills SET status = $1::bill_status, expired_at = NOW() WHERE id = $2")
                .bind(status).bind(bill_id).execute(pool).await?;
        }
        _ => {
            sqlx::query("UPDATE bills SET status = $1::bill_status WHERE id = $2")
                .bind(status).bind(bill_id).execute(pool).await?;
        }
    }
    Ok(())
}

pub async fn expire_stale_bills(pool: &PgPool) -> Result<u64> {
    let result = sqlx::query(
        "UPDATE bills SET status = 'expired', expired_at = NOW() WHERE status IN ('pending', 'processing') AND expires_at < NOW()"
    )
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}

pub async fn list_bills(
    pool: &PgPool,
    service_id: Option<Uuid>,
    status: Option<String>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Bill>> {
    let bills = sqlx::query_as::<_, Bill>(
        &format!("SELECT {} FROM bills WHERE ($1::uuid IS NULL OR service_id = $1) AND ($2::text IS NULL OR status = $2::bill_status) ORDER BY created_at DESC LIMIT $3 OFFSET $4", BILL_COLUMNS)
    )
    .bind(service_id)
    .bind(status)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(bills)
}
