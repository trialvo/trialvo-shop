use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use bigdecimal::BigDecimal;
use chrono::Utc;

use crate::api::middleware::hmac_auth::AuthenticatedService;
use crate::db::refunds::{create_refund_request, get_refund_by_id};
use crate::db::transactions::get_transaction_by_bill_id;
use crate::db::config::get_config_int;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateRefundRequest {
    pub bill_token: Option<String>,
    pub external_order_id: Option<String>,
    pub refund_amount: BigDecimal,
    pub refund_reason: String,
    pub refund_type: Option<String>,  // "full" or "partial"
    pub external_ref: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RefundResponse {
    pub success: bool,
    pub refund_id: String,
    pub status: String,
    pub message: String,
}

/// POST /api/v1/refunds
/// Request a refund (always goes to manual admin approval queue)
pub async fn create_refund_handler(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateRefundRequest>,
) -> HttpResponse {
    let auth = match req.extensions().get::<AuthenticatedService>().cloned() {
        Some(a) => a,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Unauthorized"})),
    };

    // Require bill_token to identify the bill
    let bill_token = match &body.bill_token {
        Some(t) => t.clone(),
        None => return HttpResponse::BadRequest().json(serde_json::json!({"error": "bill_token is required"})),
    };

    let bill = match crate::db::bills::get_bill_by_token(&state.db, &bill_token).await {
        Ok(Some(b)) => b,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Bill not found"})),
        Err(e) => {
            tracing::error!("Bill lookup failed: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}));
        }
    };

    // Ensure bill belongs to this service
    if bill.service_id != auth.service_id {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Access denied"}));
    }

    // Ensure bill is paid
    if bill.status != "paid" && bill.status != "partially_paid" {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": format!("Bill status '{}' cannot be refunded", bill.status)}));
    }

    // Check refund window
    let max_refund_days = get_config_int(&state.db, "general", "max_refund_days", 30).await.unwrap_or(30);
    if let Some(paid_at) = bill.paid_at {
        let days_since = (Utc::now() - paid_at).num_days();
        if days_since > max_refund_days {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!("Refund window of {} days has expired", max_refund_days)
            }));
        }
    }

    // Validate refund amount
    if body.refund_amount <= BigDecimal::from(0) || body.refund_amount > bill.final_amount {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid refund amount"}));
    }

    // Get the transaction
    let tx = match get_transaction_by_bill_id(&state.db, bill.id).await {
        Ok(Some(t)) => t,
        Ok(None) => return HttpResponse::BadRequest().json(serde_json::json!({"error": "No transaction found for this bill"})),
        Err(e) => {
            tracing::error!("Transaction lookup failed: {}", e);
            return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}));
        }
    };

    let refund_type = body.refund_type.clone().unwrap_or_else(|| {
        if body.refund_amount == bill.final_amount { "full".to_string() } else { "partial".to_string() }
    });

    match create_refund_request(
        &state.db,
        tx.id,
        bill.id,
        auth.service_id,
        &body.refund_amount,
        &body.refund_reason,
        &refund_type,
        body.external_order_id.as_deref(),
        body.external_ref.as_deref(),
        &auth.service_id.to_string(),
    )
    .await
    {
        Ok(refund) => {
            HttpResponse::Created().json(RefundResponse {
                success: true,
                refund_id: refund.id.to_string(),
                status: refund.status,
                message: "Refund request submitted. Pending admin approval.".to_string(),
            })
        }
        Err(e) => {
            tracing::error!("Refund creation failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Refund creation failed"}))
        }
    }
}

/// GET /api/v1/refunds/{id}
pub async fn get_refund_handler(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let auth = match req.extensions().get::<AuthenticatedService>().cloned() {
        Some(a) => a,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Unauthorized"})),
    };

    match get_refund_by_id(&state.db, path.into_inner()).await {
        Ok(Some(r)) if r.service_id == auth.service_id => HttpResponse::Ok().json(r),
        Ok(Some(_)) => HttpResponse::Forbidden().json(serde_json::json!({"error": "Access denied"})),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Refund not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/refunds")
            .route("", web::post().to(create_refund_handler))
            .route("/{id}", web::get().to(get_refund_handler))
    );
}
