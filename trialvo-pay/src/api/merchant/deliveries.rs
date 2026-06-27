use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use serde::Deserialize;
use uuid::Uuid;
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::AppState;

#[derive(Deserialize)]
pub struct DeliveryQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

pub async fn list_deliveries(req: HttpRequest, state: web::Data<AppState>, path: web::Path<Uuid>, query: web::Query<DeliveryQuery>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let endpoint_id = path.into_inner();
    let limit = query.limit.unwrap_or(50).min(200);
    let offset = query.offset.unwrap_or(0);

    // Verify endpoint belongs to this service
    let owned: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM ipn_endpoints WHERE id = $1 AND service_id = $2"
    ).bind(endpoint_id).bind(auth.service_id).fetch_optional(&state.db).await.unwrap_or(None);

    if owned.is_none() {
        return HttpResponse::NotFound().json(serde_json::json!({"error": "Webhook endpoint not found"}));
    }

    match sqlx::query_as::<_, crate::db::ipn::IpnDelivery>(
        "SELECT * FROM ipn_deliveries WHERE ipn_endpoint_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
    .bind(endpoint_id).bind(limit).bind(offset)
    .fetch_all(&state.db).await {
        Ok(deliveries) => HttpResponse::Ok().json(serde_json::json!({"data": deliveries, "limit": limit, "offset": offset})),
        Err(_) => HttpResponse::InternalServerError().json(serde_json::json!({"error": "Failed to list deliveries"})),
    }
}

pub async fn delivery_stats(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ipn_deliveries d JOIN ipn_endpoints e ON d.ipn_endpoint_id = e.id WHERE e.service_id = $1"
    ).bind(auth.service_id).fetch_one(&state.db).await.unwrap_or((0,));

    let delivered: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ipn_deliveries d JOIN ipn_endpoints e ON d.ipn_endpoint_id = e.id WHERE e.service_id = $1 AND d.status = 'delivered'"
    ).bind(auth.service_id).fetch_one(&state.db).await.unwrap_or((0,));

    let failed: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ipn_deliveries d JOIN ipn_endpoints e ON d.ipn_endpoint_id = e.id WHERE e.service_id = $1 AND d.status IN ('failed','exhausted')"
    ).bind(auth.service_id).fetch_one(&state.db).await.unwrap_or((0,));

    let pending: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ipn_deliveries d JOIN ipn_endpoints e ON d.ipn_endpoint_id = e.id WHERE e.service_id = $1 AND d.status IN ('queued','sent')"
    ).bind(auth.service_id).fetch_one(&state.db).await.unwrap_or((0,));

    HttpResponse::Ok().json(serde_json::json!({
        "total": total.0,
        "delivered": delivered.0,
        "failed": failed.0,
        "pending": pending.0,
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/webhooks/{id}/deliveries", web::get().to(list_deliveries))
       .route("/deliveries/stats", web::get().to(delivery_stats));
}
