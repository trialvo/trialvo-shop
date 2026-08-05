use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::db::bills::{get_bill_by_token, get_bill_items, hold_bill_for_verification, update_bill_status};
use crate::db::customers::update_customer_stats_on_payment;
use crate::db::services::get_service_by_id;
use crate::db::transactions::{
    get_transaction_by_merchant_tx_id, update_transaction_from_callback, log_event,
    record_callback_receipt, set_eps_transaction_id,
};
use crate::gateway::eps::is_eps_success_status;
use crate::gateway::reconcile::check_status_with_retries;
use crate::ipn::dispatcher::dispatch_event;
use crate::AppState;

/// Query params sent back by EPS in the callback URL
#[derive(Debug, Deserialize, Serialize)]
pub struct CallbackQuery {
    #[serde(rename = "type")]
    pub callback_type: Option<String>,
    // Live EPS redirect uses EPSTransactionId; docs/sandbox may use TransactionId
    #[serde(
        default,
        rename = "EPSTransactionId",
        alias = "TransactionId",
        alias = "transactionId",
        alias = "transaction_id"
    )]
    pub transaction_id: Option<String>,
    #[serde(default, rename = "MerchantTransactionId", alias = "merchantTransactionId")]
    pub merchant_transaction_id: Option<String>,
    #[serde(default, rename = "Amount")]
    pub amount: Option<String>,
    #[serde(default, rename = "FinancialEntity", alias = "financialEntity")]
    pub financial_entity: Option<String>,
    #[serde(default, rename = "Status")]
    pub status: Option<String>,
    #[serde(default, rename = "CustomerId", alias = "customerId")]
    pub customer_id: Option<String>,
    #[serde(default, rename = "PaymentReferance", alias = "PaymentReference", alias = "paymentReference")]
    pub payment_reference: Option<String>,
    #[serde(default, rename = "TransactionDate", alias = "transactionDate")]
    pub transaction_date: Option<String>,
    #[serde(default, rename = "ValueA")]
    pub value_a: Option<String>,
    #[serde(default, rename = "ValueB")]
    pub value_b: Option<String>,
    #[serde(default, rename = "ValueC")]
    pub value_c: Option<String>,
    #[serde(default, rename = "ValueD")]
    pub value_d: Option<String>,
    #[serde(default, rename = "ErrorCode")]
    pub error_code: Option<String>,
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
            return render_callback_page("fail", None, None, &state.config.base_url);
        }
    };

    // ── Load transaction & bill ────────────────────────────────────────────
    let tx = match get_transaction_by_merchant_tx_id(&state.db, &merchant_tx_id).await {
        Ok(Some(t)) => t,
        Ok(None) => {
            tracing::warn!("EPS callback: transaction not found for merchant_tx_id={}", merchant_tx_id);
            return render_callback_page("fail", None, None, &state.config.base_url);
        }
        Err(e) => {
            tracing::error!("EPS callback DB error: {}", e);
            return render_callback_page("fail", None, None, &state.config.base_url);
        }
    };

    let bill = match crate::db::bills::get_bill_by_id(&state.db, tx.bill_id).await {
        Ok(Some(b)) => b,
        _ => return render_callback_page("fail", None, None, &state.config.base_url),
    };

    // ── Load service (needed for fallback URLs and IPN dispatch) ──────────
    let service = match get_service_by_id(&state.db, bill.service_id).await {
        Ok(Some(s)) => s,
        _ => {
            tracing::error!("EPS callback: service not found for bill {}", bill.id);
            return render_callback_page("fail", None, None, &state.config.base_url);
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
        // Load bill items for enriched payload
        let items_json = match get_bill_items(&state.db, bill.id).await {
            Ok(items) => serde_json::json!(items.iter().map(|i| serde_json::json!({
                "product_name": i.product_name,
                "external_product_id": i.external_product_id,
                "quantity": i.quantity,
                "unit_final_price": i.unit_final_price,
            })).collect::<Vec<_>>()),
            Err(_) => serde_json::json!([]),
        };

        if let Err(e) = dispatch_event(
            &state.db,
            &state.ipn_client,
            bill.service_id,
            "payment.cancelled",
            &serde_json::json!({
                "event": "payment.cancelled",
                "data": {
                    "bill_token": bill.bill_token,
                    "bill_id": bill.id,
                    "external_order_id": bill.external_order_id,
                    "external_subscription_id": bill.external_subscription_id,
                    "status": "cancelled",
                    "amount": bill.final_amount,
                    "subtotal": bill.subtotal,
                    "final_amount": bill.final_amount,
                    "currency": bill.currency,
                    "gateway_provider": query.financial_entity,
                    "customer_name": bill.customer_name,
                    "customer_email": bill.customer_email,
                    "customer_phone": bill.customer_phone,
                    "meta": bill.service_meta,
                    "items": items_json,
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                }
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

        return render_callback_page("cancel", Some(&redirect_url), Some(&bill.bill_token), &state.config.base_url);
    }

    // Prefer EPSTransactionId from callback; fall back to init-time UUID stored on the tx
    let eps_tx_id_hint = query
        .transaction_id
        .as_deref()
        .or(tx.eps_transaction_id.as_deref());

    // ── EPS verification: ALWAYS call CheckStatus to confirm ──────────────
    // This prevents spoofed callbacks from marking bills as paid.
    // Retries absorb transient EPS 302/timeouts that previously stranded paid customers.
    let status_resp = match check_status_with_retries(
        state.get_ref(), &merchant_tx_id, eps_tx_id_hint, service.is_sandbox, 4,
    ).await {
        Ok(resp) => resp,
        Err(e) => {
            tracing::error!(
                "EPS CheckStatus failed for merchant_tx_id={}: {}. Holding for background reconcile.",
                merchant_tx_id, e
            );
            let _ = log_event(
                &state.db, tx.id, "eps_verify_failed",
                Some("processing"), Some("processing"),
                serde_json::json!({
                    "error": e.to_string(),
                    "callback_type": callback_type,
                    "callback_status": query.status,
                    "eps_transaction_id": query.transaction_id,
                    "held_for_reconcile": true,
                }),
                "eps_callback", None,
            ).await;

            // Persist callback + keep bill open so expiry worker cannot kill a paid attempt
            let _ = record_callback_receipt(
                &state.db,
                tx.id,
                query.transaction_id.as_deref(),
                query.financial_entity.as_deref(),
                query.customer_id.as_deref(),
                query.payment_reference.as_deref(),
                query.transaction_date.as_deref(),
                &raw_response,
            ).await;
            let _ = hold_bill_for_verification(&state.db, bill.id).await;

            let claims_success = callback_type == "success"
                || query
                    .status
                    .as_deref()
                    .map(is_eps_success_status)
                    .unwrap_or(false);

            // Do NOT show a hard fail when EPS already claimed success — background
            // worker will complete CheckStatus + IPN. Redirect toward success URL.
            if claims_success {
                let redirect_url = bill
                    .success_url
                    .as_deref()
                    .or(service.success_url.as_deref());
                return render_callback_page(
                    "confirming",
                    redirect_url,
                    Some(&bill.bill_token),
                    &state.config.base_url,
                );
            }

            return render_callback_page(
                "fail",
                bill.fail_url.as_deref().or(service.fail_url.as_deref()),
                Some(&bill.bill_token),
                &state.config.base_url,
            );
        }
    };

    let verified_status = status_resp
        .status
        .clone()
        .or_else(|| query.status.clone())
        .unwrap_or_else(|| "UNKNOWN".to_string());

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

    // Prefer CheckStatus fields (redirect URL often omits FinancialEntity/CustomerId)
    let financial_entity = status_resp
        .financial_entity
        .as_deref()
        .or(query.financial_entity.as_deref());
    let eps_customer_id = status_resp
        .customer_id
        .as_deref()
        .or(query.customer_id.as_deref());
    let payment_reference = status_resp
        .payment_reference
        .as_deref()
        .or(query.payment_reference.as_deref());
    let transaction_date = status_resp
        .transaction_date
        .as_deref()
        .or(query.transaction_date.as_deref());
    let confirmed_eps_tx_id = status_resp
        .transaction_id
        .as_deref()
        .or(query.transaction_id.as_deref());

    // ── Update transaction with verified status ────────────────────────────
    let _ = update_transaction_from_callback(
        &state.db,
        tx.id,
        new_tx_status,
        financial_entity,
        eps_customer_id,
        payment_reference,
        transaction_date,
        &raw_response,
        error_code,
        error_message.as_deref(),
    )
    .await;

    if let Some(eps_id) = confirmed_eps_tx_id {
        let _ = set_eps_transaction_id(&state.db, tx.id, eps_id).await;
    }

    // ── Log the EPS verification event ────────────────────────────────────
    let _ = log_event(
        &state.db, tx.id, "eps_verified",
        Some("processing"), Some(new_tx_status),
        serde_json::json!({
            "eps_verified_status": verified_status,
            "callback_type": callback_type,
            "financial_entity": financial_entity,
            "eps_transaction_id": confirmed_eps_tx_id,
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

    // Load bill items for enriched payload
    let items_json = match get_bill_items(&state.db, bill.id).await {
        Ok(items) => serde_json::json!(items.iter().map(|i| serde_json::json!({
            "product_name": i.product_name,
            "external_product_id": i.external_product_id,
            "quantity": i.quantity,
            "unit_final_price": i.unit_final_price,
        })).collect::<Vec<_>>()),
        Err(_) => serde_json::json!([]),
    };

    if let Err(e) = dispatch_event(
        &state.db,
        &state.ipn_client,
        bill.service_id,
        ipn_event,
        &serde_json::json!({
            "event": ipn_event,
            "data": {
                "id": tx.eps_merchant_tx_id,
                "bill_token": bill.bill_token,
                "bill_id": bill.id,
                "external_order_id": bill.external_order_id,
                "external_subscription_id": bill.external_subscription_id,
                "status": new_bill_status,
                "amount": tx.amount,
                "subtotal": bill.subtotal,
                "final_amount": bill.final_amount,
                "currency": tx.currency,
                "payment_method": financial_entity,
                "gateway_provider": financial_entity,
                "gateway_transaction_id": confirmed_eps_tx_id,
                "payment_reference": payment_reference,
                "transaction_date": transaction_date,
                "paid_at": if is_success { Some(chrono::Utc::now().to_rfc3339()) } else { None },
                "customer_name": bill.customer_name,
                "customer_email": bill.customer_email,
                "customer_phone": bill.customer_phone,
                "meta": bill.service_meta,
                "items": items_json,
                "eps_verified_status": verified_status,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }
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
        &state.config.base_url,
    )
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
        render_callback_page(callback_type, redirect.as_deref(), Some(bill_token), &state.config.base_url)
    } else {
        render_callback_page("fail", None, None, &state.config.base_url)
    }
}

fn render_callback_page(
    callback_type: &str,
    redirect_url: Option<&str>,
    _bill_token: Option<&str>,
    base_url: &str,
) -> HttpResponse {
    let (template, status) = match callback_type {
        "success" => (include_str!("../../templates/success.html"), 200u16),
        "confirming" => (include_str!("../../templates/confirming.html"), 200),
        "cancel"  => (include_str!("../../templates/cancelled.html"), 200),
        _         => (include_str!("../../templates/failed.html"), 200),
    };

    let redirect = redirect_url.unwrap_or(base_url);
    let html = template.replace("{{REDIRECT_URL}}", redirect);

    HttpResponse::build(actix_web::http::StatusCode::from_u16(status).unwrap())
        .content_type("text/html; charset=utf-8")
        .body(html)
}
