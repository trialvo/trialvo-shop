//! Background EPS verification for payments that received a success callback
//! but could not complete CheckStatus on the first attempt (redirects, timeouts, etc.).

use anyhow::Result;

use crate::cache::{cache_eps_token, get_cached_eps_token, get_token_ttl};
use crate::db::bills::{get_bill_by_id, get_bill_items, update_bill_status};
use crate::db::config::get_eps_credentials;
use crate::db::customers::update_customer_stats_on_payment;
use crate::db::services::get_service_by_id;
use crate::db::transactions::{
    list_pending_callback_verifications, log_event, set_eps_transaction_id,
    update_transaction_from_callback, Transaction,
};
use crate::gateway::eps::{is_eps_success_status, EpsGateway, EpsStatusResponse};
use crate::ipn::dispatcher::dispatch_event;
use crate::AppState;

/// Retry CheckStatus a few times — transient 302/5xx/timeouts should not strand a paid customer.
pub async fn check_status_with_retries(
    state: &AppState,
    merchant_tx_id: &str,
    eps_tx_id: Option<&str>,
    is_sandbox: bool,
    attempts: u32,
) -> Result<EpsStatusResponse> {
    let mut last_err = None;
    for attempt in 1..=attempts.max(1) {
        match check_status_once(state, merchant_tx_id, eps_tx_id, is_sandbox).await {
            Ok(resp) => return Ok(resp),
            Err(e) => {
                tracing::warn!(
                    "EPS CheckStatus attempt {}/{} failed for merchant_tx_id={}: {}",
                    attempt, attempts, merchant_tx_id, e
                );
                last_err = Some(e);
                if attempt < attempts {
                    let delay_ms = 400 * attempt as u64;
                    tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                }
            }
        }
    }
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("EPS CheckStatus failed")))
}

async fn check_status_once(
    state: &AppState,
    merchant_tx_id: &str,
    eps_tx_id: Option<&str>,
    is_sandbox: bool,
) -> Result<EpsStatusResponse> {
    let creds = get_eps_credentials(&state.db, &state.config.master_key, is_sandbox).await?;
    let gateway = EpsGateway::new(creds);
    let mode = gateway.get_mode();

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

    gateway.check_status(&token, merchant_tx_id, eps_tx_id).await
}

fn parse_ttl(expire_date: &str) -> Option<i64> {
    use chrono::{DateTime, Utc};
    let dt = DateTime::parse_from_rfc3339(expire_date)
        .or_else(|_| DateTime::parse_from_str(expire_date, "%Y-%m-%dT%H:%M:%S"))
        .ok()?;
    let remaining = dt.timestamp() - Utc::now().timestamp();
    if remaining > 0 {
        Some(remaining)
    } else {
        None
    }
}

/// Finalize a payment after a successful CheckStatus (callback path or background worker).
pub async fn finalize_verified_payment(
    state: &AppState,
    tx: &Transaction,
    status_resp: &EpsStatusResponse,
    callback_raw: &serde_json::Value,
    source: &str,
) -> Result<bool> {
    let bill = get_bill_by_id(&state.db, tx.bill_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("bill not found"))?;

    if bill.status == "paid" || tx.status == "success" {
        return Ok(false);
    }

    let verified_status = status_resp
        .status
        .clone()
        .unwrap_or_else(|| "UNKNOWN".to_string());

    if !is_eps_success_status(&verified_status) {
        let _ = update_transaction_from_callback(
            &state.db,
            tx.id,
            "failed",
            status_resp.financial_entity.as_deref(),
            status_resp.customer_id.as_deref(),
            status_resp.payment_reference.as_deref(),
            status_resp.transaction_date.as_deref(),
            callback_raw,
            Some("EPS_VERIFY_FAIL"),
            Some(&format!("EPS verified status: {}", verified_status)),
        )
        .await;
        let _ = update_bill_status(&state.db, bill.id, "failed").await;
        return Ok(false);
    }

    let financial_entity = status_resp.financial_entity.as_deref();
    let confirmed_eps_tx_id = status_resp
        .transaction_id
        .as_deref()
        .or(tx.eps_transaction_id.as_deref());

    update_transaction_from_callback(
        &state.db,
        tx.id,
        "success",
        financial_entity,
        status_resp.customer_id.as_deref(),
        status_resp.payment_reference.as_deref(),
        status_resp.transaction_date.as_deref(),
        callback_raw,
        None,
        None,
    )
    .await?;

    if let Some(eps_id) = confirmed_eps_tx_id {
        let _ = set_eps_transaction_id(&state.db, tx.id, eps_id).await;
    }

    let _ = log_event(
        &state.db,
        tx.id,
        "eps_verified",
        Some(&tx.status),
        Some("success"),
        serde_json::json!({
            "eps_verified_status": verified_status,
            "financial_entity": financial_entity,
            "eps_transaction_id": confirmed_eps_tx_id,
            "source": source,
        }),
        source,
        None,
    )
    .await;

    update_bill_status(&state.db, bill.id, "paid").await?;

    if let Some(customer_id) = bill.customer_id {
        let _ = update_customer_stats_on_payment(&state.db, customer_id, &bill.final_amount).await;
    }

    let items_json = match get_bill_items(&state.db, bill.id).await {
        Ok(items) => serde_json::json!(items
            .iter()
            .map(|i| {
                serde_json::json!({
                    "product_name": i.product_name,
                    "external_product_id": i.external_product_id,
                    "quantity": i.quantity,
                    "unit_final_price": i.unit_final_price,
                })
            })
            .collect::<Vec<_>>()),
        Err(_) => serde_json::json!([]),
    };

    if let Err(e) = dispatch_event(
        &state.db,
        &state.ipn_client,
        bill.service_id,
        "payment.success",
        &serde_json::json!({
            "event": "payment.success",
            "data": {
                "id": tx.eps_merchant_tx_id,
                "bill_token": bill.bill_token,
                "bill_id": bill.id,
                "external_order_id": bill.external_order_id,
                "external_subscription_id": bill.external_subscription_id,
                "status": "paid",
                "amount": tx.amount,
                "subtotal": bill.subtotal,
                "final_amount": bill.final_amount,
                "currency": tx.currency,
                "payment_method": financial_entity,
                "gateway_provider": financial_entity,
                "gateway_transaction_id": confirmed_eps_tx_id,
                "payment_reference": status_resp.payment_reference,
                "transaction_date": status_resp.transaction_date,
                "paid_at": chrono::Utc::now().to_rfc3339(),
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
    )
    .await
    {
        tracing::error!(
            "IPN dispatch failed during reconcile for merchant_tx_id={}: {}",
            tx.eps_merchant_tx_id, e
        );
    }

    tracing::info!(
        "EPS payment finalized via {}: merchant_tx_id={}",
        source, tx.eps_merchant_tx_id
    );
    Ok(true)
}

/// Poll open callback receipts and complete them once CheckStatus succeeds.
pub async fn run_eps_reconcile_worker(state: AppState) {
    tracing::info!("EPS reconcile worker started");
    loop {
        if let Err(e) = reconcile_once(&state).await {
            tracing::error!("EPS reconcile worker tick error: {}", e);
        }
        tokio::time::sleep(std::time::Duration::from_secs(45)).await;
    }
}

async fn reconcile_once(state: &AppState) -> Result<()> {
    let pending = list_pending_callback_verifications(&state.db, 25).await?;
    if pending.is_empty() {
        return Ok(());
    }

    tracing::info!("EPS reconcile: {} pending callback verification(s)", pending.len());

    for tx in pending {
        let bill = match get_bill_by_id(&state.db, tx.bill_id).await? {
            Some(b) => b,
            None => continue,
        };
        if bill.status == "paid" {
            continue;
        }

        let service = match get_service_by_id(&state.db, bill.service_id).await? {
            Some(s) => s,
            None => continue,
        };

        match check_status_with_retries(
            state,
            &tx.eps_merchant_tx_id,
            tx.eps_transaction_id.as_deref(),
            service.is_sandbox,
            3,
        )
        .await
        {
            Ok(resp) => {
                let raw = tx
                    .gateway_response_raw
                    .clone()
                    .unwrap_or_else(|| serde_json::json!({"reconcile": true}));
                match finalize_verified_payment(state, &tx, &resp, &raw, "eps_reconcile_worker").await {
                    Ok(true) => tracing::info!(
                        "Reconciled stuck payment merchant_tx_id={}",
                        tx.eps_merchant_tx_id
                    ),
                    Ok(false) => {}
                    Err(e) => tracing::error!(
                        "Finalize failed for merchant_tx_id={}: {}",
                        tx.eps_merchant_tx_id, e
                    ),
                }
            }
            Err(e) => {
                tracing::warn!(
                    "Still unable to verify merchant_tx_id={} (will retry): {}",
                    tx.eps_merchant_tx_id, e
                );
                let _ = log_event(
                    &state.db,
                    tx.id,
                    "eps_reconcile_retry",
                    Some(&tx.status),
                    Some(&tx.status),
                    serde_json::json!({"error": e.to_string()}),
                    "eps_reconcile_worker",
                    None,
                )
                .await;
            }
        }
    }

    Ok(())
}
