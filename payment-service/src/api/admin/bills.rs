use actix_web::{web, HttpResponse};
use uuid::Uuid;
use serde::Deserialize;
use crate::db::bills::*;
use crate::AppState;

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<i64>, pub per_page: Option<i64>,
    pub limit: Option<i64>, pub offset: Option<i64>,
    pub service_id: Option<Uuid>, pub status: Option<String>,
}

pub async fn list(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(25);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    match list_bills(&state.db, query.service_id, query.status.clone(), per_page, offset).await {
        Ok(bills) => HttpResponse::Ok().json(serde_json::json!({"data": bills, "page": page, "per_page": per_page})),
        Err(e) => {
            tracing::error!("list_bills error: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        },
    }
}


pub async fn get(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let bill = match get_bill_by_id(&state.db, path.into_inner()).await {
        Ok(Some(b)) => b,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };
    let items = get_bill_items(&state.db, bill.id).await.unwrap_or_default();
    HttpResponse::Ok().json(serde_json::json!({"bill": bill, "items": items}))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/bills")
            .route("", web::get().to(list))
            .route("/{id}", web::get().to(get))
    );
}
