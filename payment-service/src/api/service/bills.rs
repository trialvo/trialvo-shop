use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal;

use crate::api::middleware::hmac_auth::AuthenticatedService;
use crate::db::bills::{CreateBillInput, CreateBillItemInput, create_bill, get_bill_by_token, update_bill_status};
use crate::db::config::get_config_int;
use crate::db::customers::resolve_or_create_customer;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateBillRequest {
    pub external_order_id: Option<String>,
    pub external_subscription_id: Option<String>,
    pub external_invoice_id: Option<String>,
    pub payment_type: Option<String>,
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
    pub meta: Option<serde_json::Value>,
    pub items: Vec<BillItemRequest>,
}

#[derive(Debug, Deserialize)]
pub struct BillItemRequest {
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

#[derive(Debug, Serialize)]
pub struct CreateBillResponse {
    pub success: bool,
    pub bill_token: String,
    pub pay_url: String,
    pub expires_at: String,
}

/// POST /api/v1/bills
/// Create a new bill and return a payment URL
pub async fn create_bill_handler(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateBillRequest>,
) -> HttpResponse {
    let auth = match req.extensions().get::<AuthenticatedService>().cloned() {
        Some(a) => a,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Unauthorized"})),
    };

    // Get bill expiry from config
    let expiry_minutes = get_config_int(&state.db, "general", "bill_expiry_minutes", 30)
        .await
        .unwrap_or(30);

    // Resolve or create customer (and link to bill)
    let customer_id = match resolve_or_create_customer(
        &state.db,
        &body.customer_name,
        &body.customer_email,
        &body.customer_phone,
        auth.service_id,
    )
    .await
    {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Customer resolution failed: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to resolve customer"}));
        }
    };

    let items: Vec<CreateBillItemInput> = body.items.iter().map(|i| CreateBillItemInput {
        external_product_id: i.external_product_id.clone(),
        product_name: i.product_name.clone(),
        product_category: i.product_category.clone(),
        product_profile: i.product_profile.clone(),
        quantity: i.quantity,
        unit_buying_price: i.unit_buying_price.clone(),
        unit_selling_price: i.unit_selling_price.clone(),
        unit_discount: i.unit_discount.clone(),
        unit_final_price: i.unit_final_price.clone(),
        meta: i.meta.clone(),
    }).collect();

    let input = CreateBillInput {
        service_id: auth.service_id,
        customer_id: Some(customer_id),
        external_order_id: body.external_order_id.clone(),
        external_subscription_id: body.external_subscription_id.clone(),
        external_invoice_id: body.external_invoice_id.clone(),
        payment_type: body.payment_type.clone().unwrap_or_else(|| "one_time".to_string()),
        currency: body.currency.clone(),
        subtotal: body.subtotal.clone(),
        total_discount: body.total_discount.clone(),
        tax_amount: body.tax_amount.clone(),
        shipping_amount: body.shipping_amount.clone(),
        final_amount: body.final_amount.clone(),
        customer_name: body.customer_name.clone(),
        customer_email: body.customer_email.clone(),
        customer_phone: body.customer_phone.clone(),
        customer_address: body.customer_address.clone(),
        customer_address2: body.customer_address2.clone(),
        customer_city: body.customer_city.clone(),
        customer_state: body.customer_state.clone(),
        customer_postcode: body.customer_postcode.clone(),
        customer_country: body.customer_country.clone(),
        shipment_name: body.shipment_name.clone(),
        shipment_address: body.shipment_address.clone(),
        shipment_address2: body.shipment_address2.clone(),
        shipment_city: body.shipment_city.clone(),
        shipment_state: body.shipment_state.clone(),
        shipment_postcode: body.shipment_postcode.clone(),
        shipment_country: body.shipment_country.clone(),
        shipment_method: body.shipment_method.clone(),
        subscription_tier: body.subscription_tier.clone(),
        subscription_period: body.subscription_period.clone(),
        subscription_cost: body.subscription_cost.clone(),
        success_url: body.success_url.clone(),
        fail_url: body.fail_url.clone(),
        cancel_url: body.cancel_url.clone(),
        client_ip: req.connection_info().realip_remote_addr().map(String::from),
        user_agent: req.headers().get("User-Agent").and_then(|v| v.to_str().ok()).map(String::from),
        service_meta: body.meta.clone(),
        items,
        expiry_minutes,
    };

    match create_bill(&state.db, input).await {
        Ok(bill) => {
            let base_url = &state.config.base_url;
            let pay_url = format!("{}/pay/{}", base_url, bill.bill_token);
            HttpResponse::Created().json(CreateBillResponse {
                success: true,
                bill_token: bill.bill_token,
                pay_url,
                expires_at: bill.expires_at.to_rfc3339(),
            })
        }
        Err(e) => {
            tracing::error!("Bill creation failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Bill creation failed"}))
        }
    }
}

/// GET /api/v1/bills/{token}
pub async fn get_bill_handler(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> HttpResponse {
    let auth = match req.extensions().get::<AuthenticatedService>().cloned() {
        Some(a) => a,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Unauthorized"})),
    };

    let token = path.into_inner();
    match get_bill_by_token(&state.db, &token).await {
        Ok(Some(bill)) if bill.service_id == auth.service_id => {
            HttpResponse::Ok().json(bill)
        }
        Ok(Some(_)) => HttpResponse::Forbidden().json(serde_json::json!({"error": "Access denied"})),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Bill not found"})),
        Err(e) => {
            tracing::error!("Get bill failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        }
    }
}

/// DELETE /api/v1/bills/{token} — Cancel a pending bill
pub async fn cancel_bill_handler(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> HttpResponse {
    let auth = match req.extensions().get::<AuthenticatedService>().cloned() {
        Some(a) => a,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Unauthorized"})),
    };

    let token = path.into_inner();
    match get_bill_by_token(&state.db, &token).await {
        Ok(Some(bill)) if bill.service_id == auth.service_id => {
            if bill.status != "pending" {
                return HttpResponse::BadRequest()
                    .json(serde_json::json!({"error": format!("Cannot cancel bill in '{}' status", bill.status)}));
            }
            match update_bill_status(&state.db, bill.id, "cancelled").await {
                Ok(_) => HttpResponse::Ok().json(serde_json::json!({"success": true, "message": "Bill cancelled"})),
                Err(e) => {
                    tracing::error!("Cancel bill failed: {}", e);
                    HttpResponse::InternalServerError().json(serde_json::json!({"error": "Cancel failed"}))
                }
            }
        }
        Ok(Some(_)) => HttpResponse::Forbidden().json(serde_json::json!({"error": "Access denied"})),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Bill not found"})),
        Err(e) => {
            tracing::error!("Get bill failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        }
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/bills")
            .route("", web::post().to(create_bill_handler))
            .route("/{token}", web::get().to(get_bill_handler))
            .route("/{token}", web::delete().to(cancel_bill_handler))
    );
}
