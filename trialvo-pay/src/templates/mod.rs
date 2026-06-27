use crate::db::bills::{Bill, BillItem};
use crate::db::services::Service;
use bigdecimal::ToPrimitive;

/// Render the payment page HTML with bill details and service branding.
pub fn render_payment_page(bill: &Bill, service: &Service, items: &[BillItem], base_url: &str) -> String {
    let brand_color = service.meta
        .get("brand_color")
        .and_then(|v| v.as_str())
        .unwrap_or("#6366f1");

    let logo_html = if let Some(logo) = &service.logo_url {
        format!(r#"<img src="{}" alt="{}" class="service-logo">"#, logo, service.display_name)
    } else {
        format!(r#"<div class="service-logo-text">{}</div>"#, service.display_name)
    };

    let items_html: String = items.iter().map(|item| {
        format!(r#"<div class="bill-item">
            <div class="item-info">
                <span class="item-name">{}</span>
                <span class="item-qty">x{}</span>
            </div>
            <span class="item-price">৳ {:.2}</span>
        </div>"#,
            html_escape(&item.product_name),
            item.quantity,
            item.line_total.to_f64().unwrap_or(0.0)
        )
    }).collect();

    let discount_row = if bill.total_discount > bigdecimal::BigDecimal::from(0) {
        format!(r#"<div class="summary-row discount">
            <span>Discount</span>
            <span>- ৳ {:.2}</span>
        </div>"#, bill.total_discount.to_f64().unwrap_or(0.0))
    } else { String::new() };

    let tax_row = if bill.tax_amount > bigdecimal::BigDecimal::from(0) {
        format!(r#"<div class="summary-row">
            <span>Tax</span>
            <span>৳ {:.2}</span>
        </div>"#, bill.tax_amount.to_f64().unwrap_or(0.0))
    } else { String::new() };

    let shipping_row = if bill.shipping_amount > bigdecimal::BigDecimal::from(0) {
        format!(r#"<div class="summary-row">
            <span>Shipping</span>
            <span>৳ {:.2}</span>
        </div>"#, bill.shipping_amount.to_f64().unwrap_or(0.0))
    } else { String::new() };

    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pay {amount:.2} BDT — {service}</title>
<meta name="description" content="Secure payment powered by Trialvo Pay">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/pay.css">
<style>
  :root {{ --brand: {brand_color}; }}
</style>
</head>
<body>
<div class="pay-container">
  <div class="pay-card">
    <div class="pay-header">
      {logo}
      <div class="powered-by">Secure payment by <strong>Trialvo Pay</strong></div>
    </div>

    <div class="pay-summary">
      <h2 class="summary-title">Order Summary</h2>
      <div class="bill-items">
        {items}
      </div>
      <div class="summary-divider"></div>
      {discount_row}
      {tax_row}
      {shipping_row}
      <div class="summary-row total">
        <span>Total Amount</span>
        <span class="total-amount">৳ {amount:.2}</span>
      </div>
    </div>

    <div class="pay-customer">
      <div class="customer-info">
        <span class="label">Customer</span>
        <span>{customer_name}</span>
      </div>
      <div class="customer-info">
        <span class="label">Email</span>
        <span>{customer_email}</span>
      </div>
      <div class="customer-info">
        <span class="label">Phone</span>
        <span>{customer_phone}</span>
      </div>
    </div>

    <div class="pay-expires">
      <span class="expires-icon">⏱</span>
      This payment link expires at <strong id="expires-at" data-expires="{expires_at}"></strong>
    </div>

    <button id="pay-btn" class="pay-button" onclick="initPayment('{bill_token}', '{base_url}')">
      <span id="btn-text">Pay ৳ {amount:.2}</span>
      <span id="btn-spinner" class="spinner hidden"></span>
    </button>

    <div class="pay-security">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      256-bit SSL encrypted &middot; Powered by EPS
    </div>
  </div>
</div>
<script src="/assets/js/pay.js"></script>
</body>
</html>"#,
        amount = bill.final_amount.to_f64().unwrap_or(0.0),
        service = html_escape(&service.display_name),
        brand_color = brand_color,
        logo = logo_html,
        items = items_html,
        discount_row = discount_row,
        tax_row = tax_row,
        shipping_row = shipping_row,
        customer_name = html_escape(bill.customer_name.as_deref().unwrap_or("")),
        customer_email = html_escape(bill.customer_email.as_deref().unwrap_or("")),
        customer_phone = html_escape(bill.customer_phone.as_deref().unwrap_or("")),
        expires_at = bill.expires_at.to_rfc3339(),
        bill_token = bill.bill_token,
        base_url = base_url,
    )
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
     .replace('<', "&lt;")
     .replace('>', "&gt;")
     .replace('"', "&quot;")
     .replace('\'', "&#x27;")
}
