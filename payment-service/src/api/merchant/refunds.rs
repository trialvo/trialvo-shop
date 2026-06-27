use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use serde::Deserialize;
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::AppState;

#[derive(Deserialize)]
pub struct RefundQuery {
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Deserialize)]
pub struct SubmitRefundBody {
    pub transaction_id: uuid::Uuid,
    pub amount: Option<bigdecimal::BigDecimal>,
    pub reason: String,
}

pub async fn list_refunds(req: HttpRequest, state: web::Data<AppState>, query: web::Query<RefundQuery>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let limit = query.limit.unwrap_or(50).min(200);
    let offset = query.offset.unwrap_or(0);

    let result = if let Some(ref status) = query.status {
        sqlx::query_as::<_, crate::db::refunds::Refund>(
            "SELECT * FROM refunds WHERE service_id = $1 AND status::text = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4"
        )
        .bind(auth.service_id).bind(status).bind(limit).bind(offset)
        .fetch_all(&state.db).await
    } else {
        sqlx::query_as::<_, crate::db::refunds::Refund>(
            "SELECT * FROM refunds WHERE service_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(auth.service_id).bind(limit).bind(offset)
        .fetch_all(&state.db).await
    };

    match result {
        Ok(refunds) => HttpResponse::Ok().json(serde_json::json!({"data": refunds, "limit": limit, "offset": offset})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to list refunds"})),
    }
}

pub async fn submit_refund(req: HttpRequest, state: web::Data<AppState>, body: web::Json<SubmitRefundBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    if auth.role == "viewer" {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Viewers cannot submit refunds"}));
    }

    // Verify the transaction belongs to this service
    let txn = match sqlx::query_as::<_, crate::db::transactions::Transaction>(
        "SELECT t.* FROM transactions t JOIN bills b ON t.bill_id = b.id WHERE t.id = $1 AND b.service_id = $2 AND t.status = 'success'"
    )
    .bind(body.transaction_id).bind(auth.service_id)
    .fetch_optional(&state.db).await {
        Ok(Some(t)) => t,
        Ok(None) => return HttpResponse::BadRequest().json(serde_json::json!({"error": "Transaction not found or not in success status"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Lookup failed"})),
    };

    let refund_amount = body.amount.clone().unwrap_or(txn.amount.clone());

    if refund_amount > txn.amount {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Refund amount exceeds transaction amount"}));
    }

    // Get the bill_id from the transaction
    let refund_type = if refund_amount == txn.amount { "full" } else { "partial" };

    match crate::db::refunds::create_refund_request(
        &state.db,
        txn.id,
        txn.bill_id,
        auth.service_id,
        &refund_amount,
        &body.reason,
        refund_type,
        None, // external_order_id
        None, // external_ref
        &format!("merchant:{}", auth.merchant_user_id),
    ).await {
        Ok(refund) => {
            let _ = crate::db::audit::log(&state.db, "merchant", Some(&auth.merchant_user_id.to_string()), "merchant.refund_submitted", Some("refund"), Some(&refund.id.to_string()), None, None, None, None).await;
            HttpResponse::Created().json(serde_json::json!({
                "id": refund.id,
                "status": refund.status,
                "amount": refund.refund_amount,
                "type": refund.refund_type,
                "message": "Refund request submitted. It will be reviewed by the admin."
            }))
        }
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Refund submission failed: {}", e)})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/refunds", web::get().to(list_refunds))
       .route("/refunds", web::post().to(submit_refund));
}
