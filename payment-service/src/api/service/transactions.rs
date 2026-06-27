use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use uuid::Uuid;

use crate::api::middleware::hmac_auth::AuthenticatedService;
use crate::db::transactions::{get_transaction_by_id, get_transaction_events};
use crate::AppState;

/// GET /api/v1/transactions/{id}
pub async fn get_transaction_handler(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let auth = match req.extensions().get::<AuthenticatedService>().cloned() {
        Some(a) => a,
        None => return HttpResponse::Unauthorized().json(serde_json::json!({"error": "Unauthorized"})),
    };

    let tx_id = path.into_inner();
    let tx = match get_transaction_by_id(&state.db, tx_id).await {
        Ok(Some(t)) => t,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Transaction not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };

    // Verify this transaction belongs to the service (via bill)
    let bill = match crate::db::bills::get_bill_by_id(&state.db, tx.bill_id).await {
        Ok(Some(b)) => b,
        _ => return HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
    };

    if bill.service_id != auth.service_id {
        return HttpResponse::Forbidden().json(serde_json::json!({"error": "Access denied"}));
    }

    let events = get_transaction_events(&state.db, tx_id).await.unwrap_or_default();

    HttpResponse::Ok().json(serde_json::json!({
        "transaction": tx,
        "events": events,
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/transactions")
            .route("/{id}", web::get().to(get_transaction_handler))
    );
}
