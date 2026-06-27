use anyhow::{anyhow, Result};
use bigdecimal::BigDecimal;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::crypto::hmac::compute_eps_x_hash;
use crate::db::config::EpsCredentials;

// ─── EPS API Response Structures ─────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct EpsTokenResponse {
    pub token: String,
    #[serde(alias = "expireDate", alias = "ExpireDate")]
    pub expire_date: String,
    #[serde(alias = "errorMessage", alias = "ErrorMessage")]
    pub error_message: Option<String>,
    #[serde(alias = "errorCode", alias = "ErrorCode")]
    pub error_code: Option<String>,
    pub success: Option<bool>,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EpsInitResponse {
    #[serde(alias = "TransactionId", alias = "transactionId")]
    pub transaction_id: Option<String>,
    #[serde(alias = "RedirectURL", alias = "redirectUrl", alias = "RedirectUrl")]
    pub redirect_url: Option<String>,
    pub success: Option<bool>,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct EpsStatusResponse {
    #[serde(alias = "TransactionId", alias = "transactionId")]
    pub transaction_id: Option<String>,
    #[serde(alias = "MerchantTransactionId", alias = "merchantTransactionId")]
    pub merchant_transaction_id: Option<String>,
    #[serde(alias = "CustomerOrderId", alias = "customerOrderId")]
    pub customer_order_id: Option<String>,
    #[serde(alias = "Amount", alias = "amount", alias = "TotalAmount")]
    pub amount: Option<String>,
    #[serde(alias = "Currency", alias = "currency")]
    pub currency: Option<String>,
    #[serde(alias = "FinancialEntity", alias = "financialEntity")]
    pub financial_entity: Option<String>,
    #[serde(alias = "Status", alias = "status")]
    pub status: Option<String>,
    #[serde(alias = "CustomerId", alias = "customerId")]
    pub customer_id: Option<String>,
    #[serde(alias = "PaymentReferance", alias = "PaymentReference", alias = "paymentReference")]
    pub payment_reference: Option<String>,
    #[serde(alias = "TransactionDate", alias = "transactionDate")]
    pub transaction_date: Option<String>,
    pub success: Option<bool>,
    pub message: Option<String>,
}

/// Bill item as required by EPS ProductList field
#[derive(Debug, Serialize)]
pub struct EpsProductItem {
    #[serde(rename = "ProductId")]
    pub product_id: String,
    #[serde(rename = "ProductName")]
    pub product_name: String,
    #[serde(rename = "ProductProfile")]
    pub product_profile: String,
    #[serde(rename = "ProductCategory")]
    pub product_category: String,
    #[serde(rename = "Quantity")]
    pub quantity: i32,
    #[serde(rename = "UnitBuyingPrice")]
    pub unit_buying_price: String,
    #[serde(rename = "UnitSellingPrice")]
    pub unit_selling_price: String,
    #[serde(rename = "Discount")]
    pub discount: String,
    #[serde(rename = "UnitFinalPrice")]
    pub unit_final_price: String,
}

/// All parameters for EPS InitializeEPS call
#[derive(Debug)]
pub struct EpsPaymentParams {
    pub merchant_transaction_id: String,
    pub amount: BigDecimal,
    pub customer_order_id: Option<String>,
    pub customer_name: String,
    pub customer_email: String,
    pub customer_phone: String,
    pub customer_address: String,
    pub customer_address2: Option<String>,
    pub customer_city: String,
    pub customer_state: String,
    pub customer_postcode: String,
    pub customer_country: String,
    pub shipment_name: Option<String>,
    pub shipment_address: Option<String>,
    pub shipment_address2: Option<String>,
    pub shipment_city: Option<String>,
    pub shipment_state: Option<String>,
    pub shipment_postcode: Option<String>,
    pub shipment_country: Option<String>,
    pub shipment_method: Option<String>,
    pub subscription_tier: Option<String>,
    pub subscription_period: Option<String>,
    pub subscription_cost: Option<BigDecimal>,
    pub products: Vec<EpsProductItem>,
    pub success_url: String,
    pub fail_url: String,
    pub cancel_url: String,
    pub value_a: String,  // bill_token
    pub value_b: String,  // service_slug
    pub value_c: Option<String>, // external_order_id
    pub value_d: Option<String>, // reserved
    pub transaction_type_id: i16,
    pub financial_entity_id: i32,
}

pub struct EpsGateway {
    client: Client,
    pub creds: EpsCredentials,
}

impl EpsGateway {
    pub fn new(creds: EpsCredentials) -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .expect("HTTP client init failed"),
            creds,
        }
    }

    pub fn get_mode(&self) -> String {
        self.creds.mode.clone()
    }

    // ─── Step 1: Get Bearer Token ─────────────────────────────────────────────

    pub async fn get_token(&self) -> Result<(String, String)> {
        let url = format!("{}/Auth/GetToken", self.creds.base_url);

        // x-hash = HMAC-SHA512(hash_key, username)
        let x_hash = compute_eps_x_hash(&self.creds.hash_key, &self.creds.username);

        let body = json!({
            "userName": self.creds.username,
            "password": self.creds.password,
        });

        let response = self.client
            .post(&url)
            .header("x-hash", &x_hash)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| anyhow!("EPS GetToken HTTP error: {}", e))?;

        let status = response.status();
        let text = response.text().await.unwrap_or_default();

        if !status.is_success() {
            return Err(anyhow!("EPS GetToken failed: HTTP {} — {}", status, text));
        }

        let parsed: EpsTokenResponse = serde_json::from_str(&text)
            .map_err(|e| anyhow!("EPS GetToken parse error: {} — response: {}", e, text))?;

        if parsed.error_code.is_some() || parsed.success == Some(false) {
            return Err(anyhow!("EPS GetToken returned failure: code={:?} msg={:?}", parsed.error_code, parsed.error_message));
        }

        Ok((parsed.token, parsed.expire_date))
    }

    // ─── Step 2: Initialize Payment ───────────────────────────────────────────

    pub async fn initialize_payment(
        &self,
        token: &str,
        params: &EpsPaymentParams,
    ) -> Result<EpsInitResponse> {
        let url = format!("{}/EPSEngine/InitializeEPS", self.creds.base_url);

        // x-hash = HMAC-SHA512(hash_key, merchant_transaction_id)
        let x_hash = compute_eps_x_hash(
            &self.creds.hash_key,
            &params.merchant_transaction_id,
        );

        let product_list = serde_json::to_value(&params.products)
            .map_err(|e| anyhow!("ProductList serialization failed: {}", e))?;

        let mut body = json!({
            "storeId": self.creds.store_id,
            "merchantTransactionId": params.merchant_transaction_id,
            "transactionTypeId": params.transaction_type_id,
            "financialEntityId": params.financial_entity_id,
            "transitionStatusId": 0,
            "totalAmount": format!("{:.2}", params.amount),
            "ipAddress": "127.0.0.1",
            "version": "1",
            "successUrl": params.success_url,
            "failUrl": params.fail_url,
            "cancelUrl": params.cancel_url,
            "customerName": params.customer_name,
            "customerEmail": params.customer_email,
            "customerPhone": params.customer_phone,
            "customerAddress": params.customer_address,
            "customerCity": params.customer_city,
            "customerState": params.customer_state,
            "customerPostcode": params.customer_postcode,
            "customerCountry": params.customer_country,
            "ProductList": product_list,
            "valueA": params.value_a,
            "valueB": params.value_b,
            "productName": params.products.first().map(|p| p.product_name.clone()).unwrap_or_default(),
            "productCategory": params.products.first().map(|p| p.product_category.clone()).unwrap_or_default(),
            "productProfile": "general",
            "noOfItem": params.products.len().to_string(),
        });

        // Optional fields
        if let Some(v) = &params.customer_order_id {
            body["CustomerOrderId"] = json!(v);
        }
        if let Some(v) = &params.customer_address2 {
            body["customerAddress2"] = json!(v);
        }
        if let Some(v) = &params.shipment_name {
            body["shipmentName"] = json!(v);
        }
        if let Some(v) = &params.shipment_address {
            body["shipmentAddress"] = json!(v);
        }
        if let Some(v) = &params.shipment_address2 {
            body["shipmentAddress2"] = json!(v);
        }
        if let Some(v) = &params.shipment_city {
            body["shipmentCity"] = json!(v);
        }
        if let Some(v) = &params.shipment_state {
            body["shipmentState"] = json!(v);
        }
        if let Some(v) = &params.shipment_postcode {
            body["shipmentPostcode"] = json!(v);
        }
        if let Some(v) = &params.shipment_country {
            body["shipmentCountry"] = json!(v);
        }
        if let Some(v) = &params.shipment_method {
            body["shippingMethod"] = json!(v);
        }
        if let Some(v) = &params.value_c {
            body["valueC"] = json!(v);
        }
        if let Some(v) = &params.value_d {
            body["valueD"] = json!(v);
        }

        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", token))
            .header("x-hash", &x_hash)
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| anyhow!("EPS InitializeEPS HTTP error: {}", e))?;

        let status = response.status();
        let text = response.text().await.unwrap_or_default();

        if !status.is_success() {
            return Err(anyhow!("EPS InitializeEPS failed: HTTP {} — {}", status, text));
        }

        let parsed: EpsInitResponse = serde_json::from_str(&text)
            .map_err(|e| anyhow!("EPS InitializeEPS parse error: {} — {}", e, text))?;

        Ok(parsed)
    }

    // ─── Step 3: Check Transaction Status ────────────────────────────────────

    pub async fn check_status(
        &self,
        token: &str,
        merchant_tx_id: &str,
        eps_tx_id: Option<&str>,
    ) -> Result<EpsStatusResponse> {
        // x-hash = HMAC-SHA512(hash_key, merchantTransactionId)
        let x_hash = compute_eps_x_hash(&self.creds.hash_key, merchant_tx_id);

        // Build URL with query params (CheckStatus is GET per EPS docs)
        let mut url = format!(
            "{}/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId={}",
            self.creds.base_url, merchant_tx_id
        );

        // Live V5: also send EPSTransactionId for dual lookup
        if let Some(eps_id) = eps_tx_id {
            url.push_str(&format!("&EPSTransactionId={}", eps_id));
        }

        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", token))
            .header("x-hash", &x_hash)
            .send()
            .await
            .map_err(|e| anyhow!("EPS CheckStatus HTTP error: {}", e))?;

        let status = response.status();
        let text = response.text().await.unwrap_or_default();

        if !status.is_success() {
            return Err(anyhow!("EPS CheckStatus failed: HTTP {} — {}", status, text));
        }

        let parsed: EpsStatusResponse = serde_json::from_str(&text)
            .map_err(|e| anyhow!("EPS CheckStatus parse error: {} — {}", e, text))?;

        Ok(parsed)
    }
}

/// Determine if an EPS status string means success
pub fn is_eps_success_status(status: &str) -> bool {
    matches!(status.to_uppercase().as_str(), "APPROVED" | "SUCCESS" | "COMPLETED")
}
