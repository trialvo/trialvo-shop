const crypto = require('crypto');
const axios = require('axios');
const { pool } = require('./db');

/**
 * Get dynamic settings from database with environment fallbacks
 */
async function getSettings() {
  try {
    const { rows } = await pool.query(
      "SELECT `key`, value FROM system_config WHERE `key` LIKE 'trialvo_pay_%'"
    );
    
    const config = {};
    rows.forEach(r => config[r.key] = r.value);

    return {
      baseUrl: config.trialvo_pay_base_url || process.env.TRIALVO_PAY_BASE_URL,
      serviceId: config.trialvo_pay_service_id || process.env.TRIALVO_PAY_SERVICE_ID,
      apiKey: config.trialvo_pay_api_key || process.env.TRIALVO_PAY_API_KEY,
      ipnSecret: config.trialvo_pay_ipn_secret || process.env.TRIALVO_PAY_IPN_SECRET,
      frontendUrl: config.frontend_url || process.env.FRONTEND_URL || 'http://localhost:8091',
    };
  } catch (error) {
    console.error('[Trialvo Pay] Error loading config from DB:', error.message);
    return {
      baseUrl: process.env.TRIALVO_PAY_BASE_URL,
      serviceId: process.env.TRIALVO_PAY_SERVICE_ID,
      apiKey: process.env.TRIALVO_PAY_API_KEY,
      ipnSecret: process.env.TRIALVO_PAY_IPN_SECRET,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8091',
    };
  }
}

/**
 * Generate HMAC-SHA256 signature for Trialvo Pay API
 */
function buildHeaders(settings, body = {}) {
  const { serviceId, apiKey } = settings;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyStr = JSON.stringify(body);
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

  const message = `${serviceId}:${timestamp}:${nonce}:${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', apiKey)
    .update(message)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'X-Service-Id': serviceId,
    'X-Api-Key': apiKey,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Body-Hash': bodyHash,
    'X-Signature': signature,
  };
}

/**
 * Create a bill in Trialvo Pay and return the payment URL
 * @param {object} params
 * @returns {{ bill_token, pay_url, expires_at }}
 */
async function createTrialvoPayBill(params) {
  const {
    orderId,
    productName,
    productId,
    productSlug,
    amount,           // BDT final amount (after discount)
    subtotal,         // BDT subtotal (before discount)
    discountAmount,   // BDT discount
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,  // { address, city, state, postcode, country }
    notes,
    items,            // [{ id, name, category, quantity, price, discount, finalPrice }]
    trialInstanceId,
  } = params;

  // Build items array — multiple products or fallback single
  const billItems = (items && items.length > 0) ? items.map((item) => ({
    external_product_id: item.id || productId || 'product-1',
    product_name: item.name || productName,
    product_category: item.category || 'Digital Product',
    quantity: item.quantity || 1,
    unit_selling_price: item.price || amount,
    unit_discount: item.discount || 0,
    unit_final_price: item.finalPrice || item.price || amount,
  })) : [{
    external_product_id: productId || 'product-1',
    product_name: productName,
    product_category: 'Digital Product',
    quantity: 1,
    unit_selling_price: subtotal || amount,
    unit_discount: discountAmount || 0,
    unit_final_price: amount,
  }];

  const settings = await getSettings();
  
  // Resolve address — use shipping data or defaults
  const addr = shippingAddress || {};
  const productParam = productSlug ? `&product=${productSlug}` : '';

  const body = {
    external_order_id: orderId,
    currency: 'BDT',
    subtotal: subtotal || amount,
    total_discount: discountAmount || 0,
    final_amount: amount,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_address: addr.address || 'Bangladesh',
    customer_city: addr.city || 'Dhaka',
    customer_state: addr.state || 'Dhaka',
    customer_postcode: addr.postcode || '1000',
    customer_country: addr.country || 'BD',
    success_url: `${settings.frontendUrl}/order-success?orderId=${orderId}${productParam}`,
    fail_url: `${settings.frontendUrl}/checkout?error=payment_failed${productParam ? `${productParam}` : ''}`,
    cancel_url: `${settings.frontendUrl}/checkout?error=payment_cancelled${productParam ? `${productParam}` : ''}`,
    meta: {
      order_id: orderId,
      product_slug: productSlug || null,
      notes: notes || '',
      trial_instance_id: trialInstanceId || null,
    },
    items: billItems,
  };

  const headers = buildHeaders(settings, body);

  console.log(`[Trialvo Pay] Creating bill at ${settings.baseUrl}/api/v1/bills`);
  console.log(`[Trialvo Pay] Order: ${orderId}, Items: ${billItems.length}, Amount: ${amount} BDT`);

  try {
    const response = await axios.post(
      `${settings.baseUrl}/api/v1/bills`,
      body,
      { headers, timeout: 10000 }
    );

    return response.data; // { success, bill_token, pay_url, expires_at }
  } catch (err) {
    if (err.response) {
      console.error(`[Trialvo Pay] API error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      console.error(`[Trialvo Pay] Response headers:`, JSON.stringify(err.response.headers));
    }
    throw err;
  }
}

/**
 * Verify Trialvo Pay IPN signature
 * @param {string} rawBody - raw request body string
 * @param {string} receivedSig - X-Payvault-Signature header value
 * @returns {boolean}
 */
async function verifyIpnSignature(rawBody, receivedSig) {
  const settings = await getSettings();
  if (!receivedSig || !settings.ipnSecret) return false;
  try {
    const expected = crypto
      .createHmac('sha256', settings.ipnSecret)
      .update(rawBody)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(receivedSig, 'hex');
    // timingSafeEqual throws RangeError if buffers have different lengths
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    // Catch any parsing errors (e.g. invalid hex in receivedSig)
    return false;
  }
}

module.exports = { createTrialvoPayBill, verifyIpnSignature };
