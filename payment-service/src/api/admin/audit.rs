use actix_web::{web, HttpResponse};
use serde::Deserialize;
use crate::db::audit::list_audit_logs;
use crate::AppState;

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<i64>, pub per_page: Option<i64>,
    pub limit: Option<i64>, pub offset: Option<i64>,
    pub actor_type: Option<String>, pub action: Option<String>, pub resource_type: Option<String>,
}

pub async fn list(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(50);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    match list_audit_logs(&state.db, query.actor_type.as_deref(), query.action.as_deref(), query.resource_type.as_deref(), per_page, offset).await {
        Ok(logs) => HttpResponse::Ok().json(serde_json::json!({"data": logs, "page": page})),
        Err(e) => {
            tracing::error!("list_audit_logs error: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        },
    }
}


pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/audit").route("", web::get().to(list)));
}
