use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::cache::{cache_eps_token, get_cached_eps_token, get_token_ttl};
use crate::db::bills::{get_bill_by_token, update_bill_status};
use crate::db::config::get_eps_credentials;
use crate::db::customers::update_customer_stats_on_payment;
use crate::db::services::get_service_by_id;
use crate::db::transactions::{
    get_transaction_by_merchant_tx_id, update_transaction_from_callback, log_event,
};
use crate::gateway::eps::{is_eps_success_status, EpsGateway};
use crate::ipn::dispatcher::dispatch_event;
use crate::AppState;

/// Query params sent back by EPS in the callback URL
#[derive(Debug, Deserialize, Serialize)]
pub struct CallbackQuery {
    #[serde(rename = "type")]
    pub callback_type: Option<String>,
    #[serde(rename = "TransactionId")]
    pub transaction_id: Option<String>,
    #[serde(rename = "MerchantTransactionId")]
    pub merchant_transaction_id: Option<String>,
    #[serde(rename = "Amount")]
    pub amount: Option<String>,
    #[serde(rename = "FinancialEntity")]
    pub financial_entity: Option<String>,
    #[serde(rename = "Status")]
    pub status: Option<String>,
    #[serde(rename = "CustomerId")]
    pub customer_id: Option<String>,
    #[serde(rename = "PaymentReferance")]
    pub payment_reference: Option<String>,
    #[serde(rename = "TransactionDate")]
    pub transaction_date: Option<String>,
    #[serde(rename = "ValueA")]
    pub value_a: Option<String>,
    #[serde(rename = "ValueB")]
    pub value_b: Option<String>,
    #[serde(rename = "ValueC")]
    pub value_c: Option<String>,
    #[serde(rename = "ValueD")]
    pub value_d: Option<String>,
}

/// GET /pay/callback?type={success|fail|cancel}&...
pub async fn callback_handler(
    state: web::Data<AppState>,
    query: web::Query<CallbackQuery>,
    _req: HttpRequest,
) -> HttpResponse {
    let callback_type = query.callback_type.as_deref().unwrap_or("unknown");

    tracing::info!(
        "EPS callback received: type={}, merchant_tx_id={:?}, status={:?}",
        callback_type,
        query.merchant_transaction_id,
        query.status
    );

    // ── Find MerchantTransactionId ─────────────────────────────────────────
    let merchant_tx_id = match &query.merchant_transaction_id {
        Some(id) => id.clone(),
        None => {
            // Fallback: use ValueA (bill_token) for cancel/fail redirects only
            if let Some(bill_token) = &query.value_a {
                return handle_by_bill_token(&state, bill_token, &query).await;
            }
            tracing::warn!("EPS callback missing MerchantTransactionId and ValueA");
            return render_callback_page("fail", None, None);
        }
    };

    // ── Load transaction & bill ────────────────────────────────────────────
    let tx = match get_transaction_by_merchant_tx_id(&state.db, &merchant_tx_id).await {
        Ok(Some(t)) => t,
        Ok(None) => {
            tracing::warn!("EPS callback: transaction not found for merchant_tx_id={}", merchant_tx_id);
            return render_callback_page("fail", None, None);
        }
        Err(e) => {
            tracing::error!("EPS callback DB error: {}", e);
            return render_callback_page("fail", None, None);
        }
    };

    let bill = match crate::db::bills::get_bill_by_id(&state.db, tx.bill_id).await {
        Ok(Some(b)) => b,
        _ => return render_callback_page("fail", None, None),
    };

    // ── Load service (needed for fallback URLs and IPN dispatch) ──────────
    let service = match get_service_by_id(&state.db, bill.service_id).await {
        Ok(Some(s)) => s,
        _ => {
            tracing::error!("EPS callback: service not found for bill {}", bill.id);
            return render_callback_page("fail", None, None);
        }
    };

    // ── Store raw callback payload ─────────────────────────────────────────
    let raw_response = serde_json::to_value(&*query).unwrap_or_default();

    // ── For cancel: no verification needed — customer chose to cancel ──────
    if callback_type == "cancel" {
        tracing::info!("EPS callback cancel for merchant_tx_id={}", merchant_tx_id);
        let _ = update_transaction_from_callback(
            &state.db, tx.id, "cancelled",
            query.financial_entity.as_deref(), query.customer_id.as_deref(),
            query.payment_reference.as_deref(), query.transaction_date.as_deref(),
            &raw_response, None, None,
        ).await;

        // Mark bill as cancelled (not "pending" — a cancelled bill should not be retried)
        let _ = update_bill_status(&state.db, bill.id, "cancelled").await;

        // ── Dispatch payment.cancelled IPN ─────────────────────────────────
        if let Err(e) = dispatch_event(
            &state.db,
            &state.ipn_client,
            bill.service_id,
            "payment.cancelled",
            &serde_json::json!({
                "event": "payment.cancelled",
                "bill_token": bill.bill_token,
                "amount": bill.final_amount,
                "currency": bill.currency,
                "status": "cancelled",
                "external_order_id": bill.external_order_id,
                "external_subscription_id": bill.external_subscription_id,
                "gateway_provider": query.financial_entity,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }),
            Some(tx.id),
            None,
            Some(bill.id),
        ).await {
            tracing::error!(
                "IPN dispatch failed for payment.cancelled (bill_token={}): {}",
                bill.bill_token, e
            );
        }

        // ── URL fallback: bill → service → Trialvo Pay generic ────────────────
        let redirect_url = bill.cancel_url
            .or(service.cancel_url)
            .unwrap_or_else(|| format!("{}/pay/callback?type=cancel", state.config.base_url));

        return render_callback_page("cancel", Some(&redirect_url), Some(&bill.bill_token));
    }

    // ── EPS verification: ALWAYS call CheckStatus to confirm ──────────────
    // This prevents spoofed callbacks from marking bills as paid.
    let verified_status = match verify_with_eps(&state, &merchant_tx_id, query.transaction_id.as_deref()).await {
        Ok(status) => status,
        Err(e) => {
            // EPS unreachable — log and fail safe (don't mark as paid)
            tracing::error!(
                "EPS CheckStatus failed for merchant_tx_id={}: {}. Callback rejected.",
                merchant_tx_id, e
            );
            let _ = log_event(
                &state.db, tx.id, "eps_verify_failed",
                Some("processing"), Some("processing"),
                serde_json::json!({"error": e.to_string(), "callback_type": callback_type}),
                "eps_callback", None,
            ).await;
            // Don't update bill status — leave as processing for retry
            return render_callback_page(
                "fail",
                bill.fail_url.as_deref().or(service.fail_url.as_deref()),
                Some(&bill.bill_token),
            );
        }
    };

    tracing::info!(
        "EPS verified status for merchant_tx_id={}: {}",
        merchant_tx_id, verified_status
    );

    let is_success = is_eps_success_status(&verified_status);
    let new_tx_status = if is_success { "success" } else { "failed" };
    let new_bill_status = if is_success { "paid" } else { "failed" };

    let (error_code, error_message) = if !is_success {
        (
            Some("EPS_VERIFY_FAIL"),
            Some(format!("EPS verified status: {}", verified_status)),
        )
    } else {
        (None, None)
    };

    // ── Update transaction with verified status ────────────────────────────
    let _ = update_transaction_from_callback(
        &state.db,
        tx.id,
        new_tx_status,
        query.financial_entity.as_deref(),
        query.customer_id.as_deref(),
        query.payment_reference.as_deref(),
        query.transaction_date.as_deref(),
        &raw_response,
        error_code,
        error_message.as_deref(),
    )
    .await;

    // ── Log the EPS verification event ────────────────────────────────────
    let _ = log_event(
        &state.db, tx.id, "eps_verified",
        Some("processing"), Some(new_tx_status),
        serde_json::json!({
            "eps_verified_status": verified_status,
            "callback_type": callback_type,
        }),
        "eps_callback", None,
    ).await;

    // ── Update bill ───────────────────────────────────────────────────────
    let _ = update_bill_status(&state.db, bill.id, new_bill_status).await;

    // ── Update customer stats on payment ──────────────────────────────────
    if is_success {
        if let Some(customer_id) = bill.customer_id {
            let _ = update_customer_stats_on_payment(&state.db, customer_id, &bill.final_amount).await;
        }
    }

    // ── Dispatch IPN event (payment.success or payment.failed) ────────────
    let ipn_event = if is_success { "payment.success" } else { "payment.failed" };

    if let Err(e) = dispatch_event(
        &state.db,
        &state.ipn_client,
        bill.service_id,
        ipn_event,
        &serde_json::json!({
            "event": ipn_event,
            "bill_token": bill.bill_token,
            "transaction_id": tx.eps_merchant_tx_id,
            "eps_transaction_id": query.transaction_id,
            "amount": tx.amount,
            "currency": tx.currency,
            "status": new_bill_status,
            "financial_entity": query.financial_entity,
            "gateway_provider": query.financial_entity,
            "customer_id": query.customer_id,
            "payment_reference": query.payment_reference,
            "transaction_date": query.transaction_date,
            "external_order_id": bill.external_order_id,
            "external_subscription_id": bill.external_subscription_id,
            "eps_verified_status": verified_status,
            "value_a": query.value_a,
            "value_b": query.value_b,
            "value_c": query.value_c,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        }),
        Some(tx.id),
        None,
        Some(bill.id),
    ).await {
        tracing::error!(
            "IPN dispatch failed for {} (bill_token={}): {}",
            ipn_event, bill.bill_token, e
        );
    }

    // ── URL fallback: bill → service → Trialvo Pay generic ──────────────────
    let redirect_url = if is_success {
        bill.success_url
            .or(service.success_url)
            .unwrap_or_else(|| format!("{}/pay/callback?type=success", state.config.base_url))
    } else {
        bill.fail_url
            .or(service.fail_url)
            .unwrap_or_else(|| format!("{}/pay/callback?type=fail", state.config.base_url))
    };

    render_callback_page(
        if is_success { "success" } else { "fail" },
        Some(&redirect_url),
        Some(&bill.bill_token),
    )
}

/// Verify transaction status directly with EPS API.
/// Uses cached token (reuse pattern from init_payment) to avoid extra GetToken call.
async fn verify_with_eps(
    state: &web::Data<AppState>,
    merchant_tx_id: &str,
    eps_tx_id: Option<&str>,
) -> anyhow::Result<String> {
    let creds = get_eps_credentials(&state.db, &state.config.master_key).await?;
    let gateway = EpsGateway::new(creds);
    let mode = gateway.get_mode();

    // Reuse cached token; refresh if TTL ≤ 60s
    let token = {
        let mut redis = state.redis.lock().await;
        match get_cached_eps_token(&mut redis, &mode).await {
            Ok(Some(t)) => {
                let ttl = get_token_ttl(&mut redis, &mode).await.unwrap_or(0);
                if ttl <= 60 {
                    match gateway.get_token().await {
                        Ok((new_token, expire_date)) => {
                            let ttl_secs = parse_ttl(&expire_date).unwrap_or(3600);
                            let buffered = if ttl_secs > 300 { ttl_secs - 300 } else { 60 };
                            let _ = cache_eps_token(&mut redis, &mode, &new_token, buffered as u64).await;
                            new_token
                        }
                        Err(_) => t,
                    }
                } else {
                    t
                }
            }
            _ => {
                let (new_token, expire_date) = gateway.get_token().await?;
                let ttl_secs = parse_ttl(&expire_date).unwrap_or(3600);
                let buffered = if ttl_secs > 300 { ttl_secs - 300 } else { 60 };
                let _ = cache_eps_token(&mut redis, &mode, &new_token, buffered as u64).await;
                new_token
            }
        }
    };

    let status_resp = gateway.check_status(&token, merchant_tx_id, eps_tx_id).await?;

    let eps_status = status_resp.status.unwrap_or_else(|| "UNKNOWN".to_string());
    Ok(eps_status)
}

fn parse_ttl(expire_date: &str) -> Option<i64> {
    use chrono::{DateTime, Utc};
    let dt = DateTime::parse_from_rfc3339(expire_date)
        .or_else(|_| DateTime::parse_from_str(expire_date, "%Y-%m-%dT%H:%M:%S"))
        .ok()?;
    let remaining = dt.timestamp() - Utc::now().timestamp();
    if remaining > 0 { Some(remaining) } else { None }
}

async fn handle_by_bill_token(
    state: &web::Data<AppState>,
    bill_token: &str,
    query: &CallbackQuery,
) -> HttpResponse {
    if let Ok(Some(bill)) = get_bill_by_token(&state.db, bill_token).await {
        let callback_type = query.callback_type.as_deref().unwrap_or("fail");
        // Try to get service-level fallback URLs
        let service_urls = get_service_by_id(&state.db, bill.service_id).await.ok().flatten();
        let redirect = match callback_type {
            "success" => bill.success_url.or(service_urls.and_then(|s| s.success_url)),
            "cancel"  => bill.cancel_url.or(service_urls.and_then(|s| s.cancel_url)),
            _         => bill.fail_url.or(service_urls.and_then(|s| s.fail_url)),
        };
        render_callback_page(callback_type, redirect.as_deref(), Some(bill_token))
    } else {
        render_callback_page("fail", None, None)
    }
}

fn render_callback_page(
    callback_type: &str,
    redirect_url: Option<&str>,
    _bill_token: Option<&str>,
) -> HttpResponse {
    let (template, status) = match callback_type {
        "success" => (include_str!("../../templates/success.html"), 200u16),
        "cancel"  => (include_str!("../../templates/cancelled.html"), 200),
        _         => (include_str!("../../templates/failed.html"), 200),
    };

    let redirect = redirect_url.unwrap_or("http://localhost:8091/");
    let html = template.replace("{{REDIRECT_URL}}", redirect);

    HttpResponse::build(actix_web::http::StatusCode::from_u16(status).unwrap())
        .content_type("text/html; charset=utf-8")
        .body(html)
}
