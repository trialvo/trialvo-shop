use actix_web::{web, HttpRequest, HttpResponse};
use actix_web::HttpMessage;
use uuid::Uuid;
use serde::Deserialize;
use crate::api::middleware::admin_auth::AuthenticatedAdmin;
use crate::db::refunds::*;
use crate::db::audit;
use crate::AppState;

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<i64>, pub per_page: Option<i64>,
    pub limit: Option<i64>, pub offset: Option<i64>,
    pub status: Option<String>, pub service_id: Option<Uuid>,
}

#[derive(Deserialize)]
pub struct ApproveBody { pub admin_notes: Option<String> }

#[derive(Deserialize)]
pub struct RejectBody { pub rejection_reason: String }

pub async fn list_pending(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(25);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    match list_pending_refunds(&state.db, per_page, offset).await {
        Ok(refunds) => HttpResponse::Ok().json(serde_json::json!({"data": refunds, "page": page})),
        Err(e) => {
            tracing::error!("list_pending_refunds error: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        },
    }
}

pub async fn list_all(state: web::Data<AppState>, query: web::Query<ListQuery>) -> HttpResponse {
    let (per_page, offset) = if let Some(lim) = query.limit {
        (lim, query.offset.unwrap_or(0))
    } else {
        let page = query.page.unwrap_or(1);
        let pp = query.per_page.unwrap_or(25);
        (pp, (page - 1) * pp)
    };
    let page = if per_page > 0 { offset / per_page + 1 } else { 1 };
    match list_refunds(&state.db, query.service_id, query.status.clone(), per_page, offset).await {
        Ok(refunds) => HttpResponse::Ok().json(serde_json::json!({"data": refunds, "page": page})),
        Err(e) => {
            tracing::error!("list_refunds error: {:?}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"}))
        },
    }
}


pub async fn get(state: web::Data<AppState>, path: web::Path<Uuid>) -> HttpResponse {
    match get_refund_by_id(&state.db, path.into_inner()).await {
        Ok(Some(r)) => HttpResponse::Ok().json(r),
        Ok(None) => HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    }
}

pub async fn approve(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    body: web::Json<ApproveBody>,
) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let refund_id = path.into_inner();

    match approve_refund(&state.db, refund_id, auth.admin_id, body.admin_notes.as_deref()).await {
        Ok(refund) => {
            let _ = audit::log(
                &state.db, "admin", Some(&auth.admin_id.to_string()), "refund.approve",
                Some("refund"), Some(&refund_id.to_string()), None, None, None, None,
            ).await;

            // Fetch bill_token so the merchant can correlate to their order
            let bill_token = sqlx::query_scalar::<_, String>(
                "SELECT bill_token FROM bills WHERE id = $1"
            )
            .bind(refund.bill_id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten()
            .unwrap_or_default();

            // Fire IPN: "refund.approved" (matches what merchants subscribe to)
            if let Err(e) = crate::ipn::dispatcher::dispatch_event(
                &state.db,
                &state.ipn_client,
                refund.service_id,
                "refund.approved",
                &serde_json::json!({
                    "event": "refund.approved",
                    "refund_id": refund.id,
                    "bill_id": refund.bill_id,
                    "bill_token": bill_token,
                    "refund_amount": refund.refund_amount,
                    "refund_reason": refund.refund_reason,
                    "refund_type": refund.refund_type,
                    "currency": "BDT",
                    "status": "approved",
                    "external_order_id": refund.external_order_id,
                    "admin_notes": refund.admin_notes,
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                }),
                None,
                Some(refund.id),
                Some(refund.bill_id),
            ).await {
                tracing::error!(
                    "IPN dispatch failed for refund.approved (refund_id={}): {}",
                    refund.id, e
                );
            }

            HttpResponse::Ok().json(serde_json::json!({"success": true, "refund": refund}))
        }
        Err(e) => {
            tracing::error!("Refund approve failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Approve failed"}))
        }
    }
}

pub async fn reject(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<Uuid>,
    body: web::Json<RejectBody>,
) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedAdmin>().cloned().unwrap();
    let refund_id = path.into_inner();

    if body.rejection_reason.trim().is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "rejection_reason is required"}));
    }

    match reject_refund(&state.db, refund_id, auth.admin_id, &body.rejection_reason).await {
        Ok(refund) => {
            let _ = audit::log(
                &state.db, "admin", Some(&auth.admin_id.to_string()), "refund.reject",
                Some("refund"), Some(&refund_id.to_string()), None, None, None, None,
            ).await;

            // Fetch bill_token so the merchant can correlate to their order
            let bill_token = sqlx::query_scalar::<_, String>(
                "SELECT bill_token FROM bills WHERE id = $1"
            )
            .bind(refund.bill_id)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten()
            .unwrap_or_default();

            // Fire IPN: "refund.rejected" — merchant must be notified
            if let Err(e) = crate::ipn::dispatcher::dispatch_event(
                &state.db,
                &state.ipn_client,
                refund.service_id,
                "refund.rejected",
                &serde_json::json!({
                    "event": "refund.rejected",
                    "refund_id": refund.id,
                    "bill_id": refund.bill_id,
                    "bill_token": bill_token,
                    "refund_amount": refund.refund_amount,
                    "refund_reason": refund.refund_reason,
                    "rejection_reason": refund.rejection_reason,
                    "currency": "BDT",
                    "status": "rejected",
                    "external_order_id": refund.external_order_id,
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                }),
                None,
                Some(refund.id),
                Some(refund.bill_id),
            ).await {
                tracing::error!(
                    "IPN dispatch failed for refund.rejected (refund_id={}): {}",
                    refund.id, e
                );
            }

            HttpResponse::Ok().json(serde_json::json!({"success": true, "refund": refund}))
        }
        Err(e) => {
            tracing::error!("Refund reject failed: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Reject failed"}))
        }
    }
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/refunds")
            .route("/pending", web::get().to(list_pending))
            .route("", web::get().to(list_all))
            .route("/{id}", web::get().to(get))
            .route("/{id}/approve", web::post().to(approve))
            .route("/{id}/reject", web::post().to(reject))
    );
}
