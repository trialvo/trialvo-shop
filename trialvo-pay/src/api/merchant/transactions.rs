use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use serde::Deserialize;
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::AppState;

#[derive(Deserialize)]
pub struct TxnQuery {
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn list_transactions(req: HttpRequest, state: web::Data<AppState>, query: web::Query<TxnQuery>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let limit = query.limit.unwrap_or(50).min(200);
    let offset = query.offset.unwrap_or(0);

    let result = if let Some(ref status) = query.status {
        sqlx::query_as::<_, crate::db::transactions::Transaction>(
            "SELECT t.* FROM transactions t JOIN bills b ON t.bill_id = b.id WHERE b.service_id = $1 AND t.status::text = $2 ORDER BY t.created_at DESC LIMIT $3 OFFSET $4"
        )
        .bind(auth.service_id)
        .bind(status)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, crate::db::transactions::Transaction>(
            "SELECT t.* FROM transactions t JOIN bills b ON t.bill_id = b.id WHERE b.service_id = $1 ORDER BY t.created_at DESC LIMIT $2 OFFSET $3"
        )
        .bind(auth.service_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await
    };

    match result {
        Ok(txns) => HttpResponse::Ok().json(serde_json::json!({"data": txns, "limit": limit, "offset": offset})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to list transactions"})),
    }
}

pub async fn get_transaction(req: HttpRequest, state: web::Data<AppState>, path: web::Path<uuid::Uuid>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let txn_id = path.into_inner();

    let txn = match sqlx::query_as::<_, crate::db::transactions::Transaction>(
        "SELECT t.* FROM transactions t JOIN bills b ON t.bill_id = b.id WHERE t.id = $1 AND b.service_id = $2"
    )
    .bind(txn_id)
    .bind(auth.service_id)
    .fetch_optional(&state.db)
    .await {
        Ok(Some(t)) => t,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Transaction not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Lookup failed"})),
    };

    // Get events
    let events = crate::db::transactions::get_events_for_transaction(&state.db, txn_id).await.unwrap_or_default();

    HttpResponse::Ok().json(serde_json::json!({
        "transaction": txn,
        "events": events,
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/transactions", web::get().to(list_transactions))
       .route("/transactions/{id}", web::get().to(get_transaction));
}
