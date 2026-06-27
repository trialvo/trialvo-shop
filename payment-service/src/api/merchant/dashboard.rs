use actix_web::{web, HttpRequest, HttpResponse, HttpMessage};
use crate::api::middleware::merchant_auth::AuthenticatedMerchant;
use crate::AppState;

pub async fn get_dashboard(req: HttpRequest, state: web::Data<AppState>) -> HttpResponse {
    let auth = req.extensions().get::<AuthenticatedMerchant>().cloned().unwrap();
    let sid = auth.service_id;

    // Revenue stats
    let total_revenue: (bigdecimal::BigDecimal,) = sqlx::query_as(
        "SELECT COALESCE(SUM(b.final_amount), 0) FROM bills b WHERE b.service_id = $1 AND b.status = 'paid'"
    ).bind(sid).fetch_one(&state.db).await.unwrap_or((bigdecimal::BigDecimal::from(0),));

    let today_revenue: (bigdecimal::BigDecimal,) = sqlx::query_as(
        "SELECT COALESCE(SUM(b.final_amount), 0) FROM bills b WHERE b.service_id = $1 AND b.status = 'paid' AND b.paid_at >= CURRENT_DATE"
    ).bind(sid).fetch_one(&state.db).await.unwrap_or((bigdecimal::BigDecimal::from(0),));

    let total_bills: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM bills WHERE service_id = $1"
    ).bind(sid).fetch_one(&state.db).await.unwrap_or((0,));

    let paid_bills: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM bills WHERE service_id = $1 AND status = 'paid'"
    ).bind(sid).fetch_one(&state.db).await.unwrap_or((0,));

    let pending_refunds: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM refunds WHERE service_id = $1 AND status = 'requested'"
    ).bind(sid).fetch_one(&state.db).await.unwrap_or((0,));

    let failed_webhooks: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM ipn_deliveries d JOIN ipn_endpoints e ON d.ipn_endpoint_id = e.id WHERE e.service_id = $1 AND d.status IN ('failed','exhausted') AND d.created_at > NOW() - interval '24 hours'"
    ).bind(sid).fetch_one(&state.db).await.unwrap_or((0,));

    // Recent transactions (last 10)
    let recent_txns: Vec<(uuid::Uuid, String, bigdecimal::BigDecimal, String, chrono::DateTime<chrono::Utc>)> = sqlx::query_as(
        "SELECT t.id, t.eps_merchant_tx_id, t.amount, t.status::text, t.created_at FROM transactions t JOIN bills b ON t.bill_id = b.id WHERE b.service_id = $1 ORDER BY t.created_at DESC LIMIT 10"
    ).bind(sid).fetch_all(&state.db).await.unwrap_or_default();

    let recent: Vec<serde_json::Value> = recent_txns.iter().map(|t| serde_json::json!({
        "id": t.0, "merchant_tx_id": t.1, "amount": t.2, "status": t.3, "created_at": t.4
    })).collect();

    HttpResponse::Ok().json(serde_json::json!({
        "total_revenue": total_revenue.0,
        "today_revenue": today_revenue.0,
        "total_bills": total_bills.0,
        "paid_bills": paid_bills.0,
        "pending_refunds": pending_refunds.0,
        "failed_webhooks_24h": failed_webhooks.0,
        "recent_transactions": recent,
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/dashboard", web::get().to(get_dashboard));
}
