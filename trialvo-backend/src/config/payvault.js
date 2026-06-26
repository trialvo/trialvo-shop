const crypto = require('crypto');
const axios = require('axios');

const BASE_URL = process.env.PAYVAULT_BASE_URL;
const SERVICE_ID = process.env.PAYVAULT_SERVICE_ID;
const API_KEY = process.env.PAYVAULT_API_KEY;
const IPN_SECRET = process.env.PAYVAULT_IPN_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const IPN_URL = process.env.IPN_URL || 'http://host.docker.internal:15000/api/payments/ipn';

/**
 * Generate HMAC-SHA256 signature for PayVault API
 * Signature = HMAC-SHA256(timestamp + nonce + service_id + body_hash, api_key)
 */
function buildHeaders(body = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyStr = JSON.stringify(body);
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

  // PayVault signature format: HMAC-SHA256(api_key, "service_id:timestamp:nonce:body_sha256")
  const message = `${SERVICE_ID}:${timestamp}:${nonce}:${bodyHash}`;
  const signature = crypto
    .createHmac('sha256', API_KEY)
    .update(message)
    .digest('hex');

  return {
    'Content-Type': 'application/json',
    'X-Service-Id': SERVICE_ID,
    'X-Api-Key': API_KEY,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Body-Hash': bodyHash,
    'X-Signature': signature,
  };
}

/**
 * Create a bill in PayVault and return the payment URL
 * @param {object} params
 * @returns {{ bill_token, pay_url, expires_at }}
 */
async function createPayVaultBill(params) {
  const {
    orderId,
    productName,
    productId,
    amount,           // BDT amount (number)
    customerName,
    customerEmail,
    customerPhone,
    notes,
  } = params;

  const body = {
    external_order_id: orderId,
    currency: 'BDT',
    subtotal: amount,
    final_amount: amount,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    customer_address: 'Bangladesh',
    customer_city: 'Dhaka',
    customer_state: 'Dhaka',
    customer_postcode: '1000',
    customer_country: 'BD',
    success_url: `${FRONTEND_URL}/order-success?orderId=${orderId}`,
    fail_url: `${FRONTEND_URL}/checkout?error=payment_failed`,
    cancel_url: `${FRONTEND_URL}/checkout?error=payment_cancelled`,
    meta: { order_id: orderId, notes: notes || '' },
    items: [
      {
        external_product_id: productId || 'product-1',
        product_name: productName,
        product_category: 'Digital Product',
        quantity: 1,
        unit_selling_price: amount,
        unit_final_price: amount,
      },
    ],
  };

  const headers = buildHeaders(body);

  const response = await axios.post(
    `${BASE_URL}/api/v1/bills`,
    body,
    { headers, timeout: 10000 }
  );

  return response.data; // { success, bill_token, pay_url, expires_at }
}

/**
 * Verify PayVault IPN signature
 * @param {string} rawBody - raw request body string
 * @param {string} receivedSig - X-Payvault-Signature header value
 * @returns {boolean}
 */
function verifyIpnSignature(rawBody, receivedSig) {
  if (!receivedSig || !IPN_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', IPN_SECRET)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(receivedSig, 'hex')
  );
}

module.exports = { createPayVaultBill, verifyIpnSignature };
