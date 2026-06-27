use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use uuid::Uuid;
use serde::Deserialize;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::db::customers::*;
use crate::db::audit;
use crate::AppState;

#[derive(Deserialize)]
pub struct ListQuery { pub page: Option<i64>, pub per_page: Option<i64>, pub limit: Option<i64>, pub offset: Option<i64>, pub q: Option<String> }
#[derive(Deserialize)]
pub struct BlockBody { pub reason: String }

pub async fn list(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(25);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    let result = if let Some(q) = &query.q {
        search_customers(&state.db, q, per_page, offset).await
    } else {
        list_customers(&state.db, per_page, offset).await
    };
    match result {
        Ok(customers) => HttpResponse::Ok().json(serde_json::json!({"data": customers, "page": page})),
        Err(e) => {
            tracing::error!("list_customers error: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        },
    }
}


pub async fn get(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    match get_customer_by_id(&state.db, path.into_inner()).await {
        Ok(Some(c)) => HttpResponse::Ok().json(c),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub async fn block_customer_handler(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, body: web::Json<BlockBody>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let id = path.into_inner();
    if body.reason.trim().is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "reason is required"}));
    }
    match block_customer(&state.db, id, &body.reason).await {
        Ok(_) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "customer.block", Some("customer"), Some(&id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Block failed"})),
    }
}

pub async fn unblock_customer_handler(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let id = path.into_inner();
    match unblock_customer(&state.db, id).await {
        Ok(_) => {
            let _ = audit::log(&state.db, "admin", Some(&auth.admin_id.to_string()), "customer.unblock", Some("customer"), Some(&id.to_string()), None, None, None, None).await;
            HttpResponse::Ok().json(serde_json::json!({"success": true}))
        },
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Unblock failed"})),
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/customers")
            .route("", web::get().to(list))
            .route("/{id}", web::get().to(get))
            .route("/{id}/block", web::post().to(block_customer_handler))
            .route("/{id}/unblock", web::post().to(unblock_customer_handler))
    );
}
