use actix_web::{web, HttpResponse};
use crate::AppState;

/// GET /api/admin/dashboard/stats
pub async fn get_stats(
    state: web::Data<AppState>,
    _req: actix_web::HttpRequest,
) -> HttpResponse {
    // Revenue stats using raw queries (no DATABASE_URL needed at compile time)
    let today: bigdecimal::BigDecimal = sqlx::query_scalar(
        "SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.status = 'success'::transaction_status AND DATE(t.completed_at) = CURRENT_DATE"
    ).fetch_one(&state.db).await.unwrap_or_default();

    let this_week: bigdecimal::BigDecimal = sqlx::query_scalar(
        "SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.status = 'success'::transaction_status AND t.completed_at >= DATE_TRUNC('week', NOW())"
    ).fetch_one(&state.db).await.unwrap_or_default();

    let this_month: bigdecimal::BigDecimal = sqlx::query_scalar(
        "SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.status = 'success'::transaction_status AND t.completed_at >= DATE_TRUNC('month', NOW())"
    ).fetch_one(&state.db).await.unwrap_or_default();

    let all_time: bigdecimal::BigDecimal = sqlx::query_scalar(
        "SELECT COALESCE(SUM(t.amount), 0) FROM transactions t WHERE t.status = 'success'::transaction_status"
    ).fetch_one(&state.db).await.unwrap_or_default();

    let success_rate: Option<bigdecimal::BigDecimal> = sqlx::query_scalar(
        "SELECT COUNT(*) FILTER (WHERE status = 'success'::transaction_status) * 100.0 / NULLIF(COUNT(*), 0) FROM transactions WHERE created_at >= NOW() - interval '30 days'"
    ).fetch_one(&state.db).await.unwrap_or_default();

    let active_services: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM services WHERE is_active = TRUE"
    ).fetch_one(&state.db).await.unwrap_or(0);

    let pending_refunds = crate::db::refunds::count_pending_refunds(&state.db).await.unwrap_or(0);
    let ipn_failures = crate::db::ipn::count_failed_deliveries_24h(&state.db).await.unwrap_or(0);

    // Recent transactions
    let recent_txs = sqlx::query(
        r#"SELECT t.id::text, t.eps_merchant_tx_id, t.amount::text, t.status::text,
            t.eps_financial_entity, t.created_at, s.display_name
            FROM transactions t
            JOIN bills b ON b.id = t.bill_id
            JOIN services s ON s.id = b.service_id
            ORDER BY t.created_at DESC LIMIT 10"#
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    use sqlx::Row;
    let recent: Vec<_> = recent_txs.iter().map(|row| {
        serde_json::json!({
            "id": row.try_get::<String, _>("id").unwrap_or_default(),
            "merchant_tx_id": row.try_get::<Option<String>, _>("eps_merchant_tx_id").unwrap_or_default(),
            "amount": row.try_get::<String, _>("amount").unwrap_or_default(),
            "status": row.try_get::<String, _>("status").unwrap_or_default(),
            "service": row.try_get::<String, _>("display_name").unwrap_or_default(),
            "financial_entity": row.try_get::<Option<String>, _>("eps_financial_entity").unwrap_or_default(),
            "created_at": row.try_get::<chrono::DateTime<chrono::Utc>, _>("created_at").ok().map(|d| d.to_rfc3339()),
        })
    }).collect();

    // Revenue by day (last 30 days)
    let daily = sqlx::query(
        r#"SELECT DATE(completed_at) as date, SUM(amount)::text as total
            FROM transactions
            WHERE status = 'success'::transaction_status
              AND completed_at >= NOW() - interval '30 days'
            GROUP BY DATE(completed_at)
            ORDER BY date ASC"#
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let daily_revenue: Vec<_> = daily.iter().map(|row| {
        serde_json::json!({
            "date": row.try_get::<Option<chrono::NaiveDate>, _>("date").ok().flatten().map(|d| d.to_string()),
            "total": row.try_get::<String, _>("total").unwrap_or_default(),
        })
    }).collect();

    HttpResponse::Ok().json(serde_json::json!({
        "revenue": {
            "today": today,
            "this_week": this_week,
            "this_month": this_month,
            "all_time": all_time,
        },
        "success_rate": success_rate,
        "active_services": active_services,
        "pending_refunds": pending_refunds,
        "ipn_failures_24h": ipn_failures,
        "recent_transactions": recent,
        "daily_revenue": daily_revenue,
    }))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/dashboard")
            .route("/stats", web::get().to(get_stats))
    );
}
