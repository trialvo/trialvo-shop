use actix_web::{web, HttpRequest, HttpResponse};
use chrono::Utc;
use uuid::Uuid;

use crate::cache::{cache_eps_token, get_cached_eps_token, get_token_ttl};
use crate::db::bills::{Bill, get_bill_by_token, get_bill_items, update_bill_status};
use crate::db::config::get_eps_credentials;
use crate::db::services::{Service, get_service_by_id};
use crate::db::transactions::create_transaction;
use crate::gateway::eps::{EpsGateway, EpsPaymentParams, EpsProductItem};
use crate::AppState;

/// GET /pay/{bill_token}
/// Render the payment page OR redirect if already paid.
pub async fn payment_page(
    state: web::Data<AppState>,
    path: web::Path<String>,
    _req: HttpRequest,
) -> HttpResponse {
    let bill_token = path.into_inner();

    let bill = match get_bill_by_token(&state.db, &bill_token).await {
        Ok(Some(b)) => b,
        Ok(None) => return render_not_found(),
        Err(_) => return render_error("Internal error loading bill"),
    };

    // Check expiry
    if bill.expires_at < Utc::now() && bill.status == "pending" {
        let _ = update_bill_status(&state.db, bill.id, "expired").await;
        return render_expired(&bill_token);
    }

    match bill.status.as_str() {
        "paid" => return render_success_redirect(&bill, &state.config.base_url),
        "expired" => return render_expired(&bill_token),
        "cancelled" => return render_cancelled(&bill),
        "failed" => {}, // Show payment page again (allow retry)
        "pending" | "processing" => {}, // Normal — show payment form
        _ => return render_error("Invalid bill state"),
    }

    // Get service for white-labeling
    let service = match get_service_by_id(&state.db, bill.service_id).await {
        Ok(Some(s)) => s,
        _ => return render_error("Service not found"),
    };

    // Check skip_preview setting — if enabled, init EPS server-side and redirect directly
    let skip_preview = service.meta
        .get("skip_preview")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    if skip_preview {
        return handle_skip_preview(&state, &bill, &service, &_req).await;
    }

    // Get bill items
    let items = get_bill_items(&state.db, bill.id).await.unwrap_or_default();

    // Render the payment HTML template
    let html = crate::templates::render_payment_page(&bill, &service, &items, &state.config.base_url);
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

/// Result of a successful EPS init — contains the redirect URL and transaction ID.
struct EpsInitResult {
    redirect_url: String,
    transaction_id: Uuid,
}

/// Shared helper: performs the full EPS init flow (token → transaction → EPS InitializeEPS).
/// Used by both `init_payment()` (AJAX) and `handle_skip_preview()` (server-side redirect).
async fn perform_eps_init(
    state: &web::Data<AppState>,
    bill: &Bill,
    service: &Service,
    req: &HttpRequest,
) -> Result<EpsInitResult, String> {
    // Get EPS credentials
    let creds = match get_eps_credentials(&state.db, &state.config.master_key).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("EPS credentials error: {}", e);
            return Err("Payment gateway not configured".to_string());
        }
    };

    let gateway = EpsGateway::new(creds);
    let mode = gateway.get_mode();

    // Get or refresh token from Redis
    let mut redis = state.redis.lock().await;
    let token = match get_cached_eps_token(&mut redis, &mode).await {
        Ok(Some(t)) => {
            let ttl = get_token_ttl(&mut redis, &mode).await.unwrap_or(0);
            if ttl <= 60 {
                match get_fresh_token_internal(&gateway, &mut redis, &mode).await {
                    Ok(tok) => tok,
                    Err(e) => {
                        tracing::error!("EPS GetToken refresh failed: {}", e);
                        t
                    }
                }
            } else {
                t
            }
        }
        _ => match get_fresh_token_internal(&gateway, &mut redis, &mode).await {
            Ok(tok) => tok,
            Err(e) => {
                tracing::error!("EPS GetToken failed: {}", e);
                drop(redis);
                return Err("Payment gateway unavailable".to_string());
            }
        },
    };
    drop(redis);

    // Create transaction record
    let client_ip = req.connection_info().realip_remote_addr().map(String::from);
    let user_agent = req.headers().get("User-Agent").and_then(|v| v.to_str().ok()).map(String::from);

    let tx = match create_transaction(
        &state.db,
        bill.id,
        &bill.final_amount,
        &bill.bill_token,
        &service.slug,
        bill.external_order_id.as_deref(),
        client_ip.as_deref(),
        user_agent.as_deref(),
        1, // transaction_type_id: 1=Web
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("Transaction creation failed: {}", e);
            return Err("Transaction creation failed".to_string());
        }
    };

    // Build EPS product list
    let items = get_bill_items(&state.db, bill.id).await.unwrap_or_default();
    let products: Vec<EpsProductItem> = items.iter().map(|item| EpsProductItem {
        product_id: item.external_product_id.clone().unwrap_or_else(|| item.id.to_string()),
        product_name: item.product_name.clone(),
        product_profile: item.product_profile.clone().unwrap_or_else(|| "General".to_string()),
        product_category: item.product_category.clone().unwrap_or_else(|| "General".to_string()),
        quantity: item.quantity,
        unit_buying_price: item.unit_buying_price.as_ref().map(|p| format!("{:.2}", p)).unwrap_or_else(|| "0.00".to_string()),
        unit_selling_price: format!("{:.2}", item.unit_selling_price),
        discount: format!("{:.2}", item.unit_discount),
        unit_final_price: format!("{:.2}", item.unit_final_price),
    }).collect();

    // Build callback URLs
    let base = &state.config.base_url;
    let success_url = format!("{}/pay/callback?type=success", base);
    let fail_url = format!("{}/pay/callback?type=fail", base);
    let cancel_url = format!("{}/pay/callback?type=cancel", base);

    let params = EpsPaymentParams {
        merchant_transaction_id: tx.eps_merchant_tx_id.clone(),
        amount: bill.final_amount.clone(),
        customer_order_id: bill.external_order_id.clone(),
        customer_name: bill.customer_name.clone().unwrap_or_default(),
        customer_email: bill.customer_email.clone().unwrap_or_default(),
        customer_phone: bill.customer_phone.clone().unwrap_or_default(),
        customer_address: bill.customer_address.clone().unwrap_or_default(),
        customer_address2: bill.customer_address2.clone(),
        customer_city: bill.customer_city.clone().unwrap_or_default(),
        customer_state: bill.customer_state.clone().unwrap_or_default(),
        customer_postcode: bill.customer_postcode.clone().unwrap_or_default(),
        customer_country: bill.customer_country.clone().unwrap_or_else(|| "BD".to_string()),
        shipment_name: bill.shipment_name.clone(),
        shipment_address: bill.shipment_address.clone(),
        shipment_address2: bill.shipment_address2.clone(),
        shipment_city: bill.shipment_city.clone(),
        shipment_state: bill.shipment_state.clone(),
        shipment_postcode: bill.shipment_postcode.clone(),
        shipment_country: bill.shipment_country.clone(),
        shipment_method: bill.shipment_method.clone(),
        subscription_tier: bill.subscription_tier.clone(),
        subscription_period: bill.subscription_period.clone(),
        subscription_cost: bill.subscription_cost.clone(),
        products,
        success_url,
        fail_url,
        cancel_url,
        value_a: bill.bill_token.clone(),
        value_b: service.slug.clone(),
        value_c: bill.external_order_id.clone(),
        value_d: None,
        transaction_type_id: 1,
        financial_entity_id: 0,
    };

    match gateway.initialize_payment(&token, &params).await {
        Ok(resp) => {
            if let (Some(eps_tx_id), Some(redirect_url)) = (&resp.transaction_id, &resp.redirect_url) {
                let _ = crate::db::transactions::update_transaction_after_init(
                    &state.db,
                    tx.id,
                    eps_tx_id,
                    redirect_url,
                )
                .await;

                let _ = update_bill_status(&state.db, bill.id, "processing").await;

                Ok(EpsInitResult {
                    redirect_url: redirect_url.clone(),
                    transaction_id: tx.id,
                })
            } else {
                let detail = resp.message.unwrap_or_else(|| "No redirect URL".to_string());
                tracing::error!("EPS returned no redirect URL: {}", detail);
                Err(format!("Payment gateway error: {}", detail))
            }
        }
        Err(e) => {
            tracing::error!("EPS initialize payment failed: {}", e);
            Err("Payment gateway unavailable".to_string())
        }
    }
}

/// Handle skip_preview mode: init EPS server-side and 302 redirect to EPS gateway.
/// Customer never sees the Trialvo Pay UI.
async fn handle_skip_preview(
    state: &web::Data<AppState>,
    bill: &Bill,
    service: &Service,
    req: &HttpRequest,
) -> HttpResponse {
    match perform_eps_init(state, bill, service, req).await {
        Ok(result) => {
            tracing::info!(
                "skip_preview: redirecting bill {} to EPS gateway",
                bill.bill_token
            );
            HttpResponse::Found()
                .insert_header(("Location", result.redirect_url))
                .finish()
        }
        Err(err) => {
            tracing::error!(
                "skip_preview: EPS init failed for bill {}: {}",
                bill.bill_token, err
            );
            render_skip_preview_error(&err, &bill.bill_token)
        }
    }
}

/// POST /pay/{bill_token}/init
/// Initiates payment — creates transaction, calls EPS, returns redirect URL
pub async fn init_payment(
    state: web::Data<AppState>,
    path: web::Path<String>,
    req: HttpRequest,
) -> HttpResponse {
    let bill_token = path.into_inner();

    let bill = match get_bill_by_token(&state.db, &bill_token).await {
        Ok(Some(b)) => b,
        Ok(None) => return HttpResponse::NotFound().json(serde_json::json!({"error": "Bill not found"})),
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Internal error"})),
    };

    if bill.status != "pending" && bill.status != "failed" {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": format!("Bill is in '{}' status", bill.status)
        }));
    }

    if bill.expires_at < Utc::now() {
        let _ = update_bill_status(&state.db, bill.id, "expired").await;
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Bill has expired"}));
    }

    // Get service
    let service = match get_service_by_id(&state.db, bill.service_id).await {
        Ok(Some(s)) => s,
        _ => return HttpResponse::InternalServerError().json(serde_json::json!({"error": "Service not found"})),
    };

    match perform_eps_init(&state, &bill, &service, &req).await {
        Ok(result) => {
            HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "redirect_url": result.redirect_url,
                "transaction_id": result.transaction_id,
            }))
        }
        Err(err) => {
            HttpResponse::ServiceUnavailable().json(serde_json::json!({"error": err}))
        }
    }
}

async fn get_fresh_token_internal(
    gateway: &EpsGateway,
    redis: &mut redis::aio::ConnectionManager,
    mode: &str,
) -> anyhow::Result<String> {
    let (token, expire_date) = gateway.get_token().await?;
    // Parse expire_date to compute TTL
    // expire_date typically: "2024-01-01T12:00:00"
    let ttl = parse_ttl_from_expire_date(&expire_date).unwrap_or(3600);
    // Cache with 5 minute buffer
    let ttl_with_buffer = if ttl > 300 { ttl - 300 } else { 60 };
    cache_eps_token(redis, mode, &token, ttl_with_buffer as u64).await?;
    Ok(token)
}

fn parse_ttl_from_expire_date(expire_date: &str) -> Option<i64> {
    use chrono::DateTime;
    let dt = DateTime::parse_from_rfc3339(expire_date)
        .or_else(|_| DateTime::parse_from_str(expire_date, "%Y-%m-%dT%H:%M:%S"))
        .ok()?;
    let remaining = dt.timestamp() - Utc::now().timestamp();
    if remaining > 0 { Some(remaining) } else { None }
}

fn render_not_found() -> HttpResponse {
    let html = include_str!("../../templates/not_found.html");
    HttpResponse::NotFound()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

fn render_expired(_bill_token: &str) -> HttpResponse {
    let html = include_str!("../../templates/expired.html");
    HttpResponse::Gone()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

fn render_error(msg: &str) -> HttpResponse {
    HttpResponse::InternalServerError()
        .content_type("text/html; charset=utf-8")
        .body(format!("<h1>Error</h1><p>{}</p>", msg))
}

fn render_success_redirect(bill: &crate::db::bills::Bill, base_url: &str) -> HttpResponse {
    let url = bill.success_url.clone()
        .unwrap_or_else(|| format!("{}/pay/callback?type=success", base_url));
    HttpResponse::Found()
        .insert_header(("Location", url))
        .finish()
}

fn render_cancelled(_bill: &crate::db::bills::Bill) -> HttpResponse {
    let html = include_str!("../../templates/cancelled.html");
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

/// Render a minimal error page for skip_preview mode with a retry button.
fn render_skip_preview_error(error_msg: &str, bill_token: &str) -> HttpResponse {
    let html = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment Error — Trialvo Pay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }}
  .error-card {{ background: #1e293b; border-radius: 16px; padding: 40px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }}
  .error-icon {{ font-size: 48px; margin-bottom: 16px; }}
  h1 {{ font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #f87171; }}
  p {{ font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }}
  .retry-btn {{ display: inline-block; padding: 12px 32px; background: #6366f1; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; transition: background 0.2s; }}
  .retry-btn:hover {{ background: #4f46e5; }}
  .footer {{ margin-top: 24px; font-size: 12px; color: #64748b; }}
</style>
</head>
<body>
<div class="error-card">
  <div class="error-icon">⚠️</div>
  <h1>Payment Temporarily Unavailable</h1>
  <p>We couldn't connect to the payment gateway. Please try again in a moment.</p>
  <a href="/pay/{bill_token}" class="retry-btn">Try Again</a>
  <div class="footer">Secured by Trialvo Pay</div>
</div>
</body>
</html>"#, bill_token = bill_token);
    HttpResponse::ServiceUnavailable()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/pay")
            .route("/callback", web::get().to(super::callback::callback_handler))
            .route("/{token}", web::get().to(payment_page))
            .route("/{token}/init", web::post().to(init_payment))
    );
}
