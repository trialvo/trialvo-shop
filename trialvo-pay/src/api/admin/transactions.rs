use actix_web::{web, HttpResponse};
use uuid::Uuid;
use serde::Deserialize;
use crate::db::transactions::*;
use crate::AppState;

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub service_id: Option<Uuid>,
    pub status: Option<String>,
}

pub async fn list(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    // Support both page/per_page and limit/offset params
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(25);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    match list_transactions(&state.db, query.service_id, query.status.clone(), per_page, offset).await {
        Ok(txs) => {
            let total = count_transactions(&state.db, query.service_id, query.status.clone()).await.unwrap_or(txs.len() as i64);
            HttpResponse::Ok().json(serde_json::json!({"data": txs, "page": page, "per_page": per_page, "total": total}))
        },
        Err(e) => {
            tracing::error!("list_transactions error: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        },
    }
}


pub async fn get(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let tx_id = path.into_inner();
    let tx = match get_transaction_by_id(&state.db, tx_id).await {
        Ok(Some(t)) => t,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };
    let events = get_transaction_events(&state.db, tx_id).await.unwrap_or_default();
    let bill = crate::db::bills::get_bill_by_id(&state.db, tx.bill_id).await.ok().flatten();
    HttpResponse::Ok().json(serde_json::json!({"transaction": tx, "events": events, "bill": bill}))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/transactions")
            .route("", web::get().to(list))
            .route("/{id}", web::get().to(get))
    );
}
