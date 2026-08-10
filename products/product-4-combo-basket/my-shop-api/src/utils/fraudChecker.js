/**
 * fraudChecker.js — Backend utility for fraudchecker.link API
 * Reads API key & enabled flag from DB (shop_config table).
 * Called automatically when an order is placed — non-blocking.
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://fraudchecker.link/api/v1/qc/';

/**
 * Call fraudchecker.link API with the given phone and API key.
 * Returns enriched result or null on any failure.
 */
async function callFraudApi(phone, apiKey) {
 return new Promise((resolve) => {
  const body = JSON.stringify({ phone });
  const url = new URL(BASE_URL);
  const lib = url.protocol === 'https:' ? https : http;

  const options = {
   hostname: url.hostname,
   path: url.pathname,
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': `Bearer ${apiKey}`,
   },
   timeout: 8000,
  };

  const req = lib.request(options, (res) => {
   let data = '';
   res.on('data', chunk => { data += chunk; });
   res.on('end', () => {
    try {
     if (res.statusCode !== 200) { resolve(null); return; }
     const json = JSON.parse(data);

     const total = json.total_parcels || 0;
     const delivered = json.total_delivered || 0;
     const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

     let riskLevel = 'unknown';
     if (total === 0) riskLevel = 'unknown';
     else if (deliveryRate >= 70) riskLevel = 'safe';
     else if (deliveryRate >= 40) riskLevel = 'medium';
     else riskLevel = 'high';

     resolve({
      success: true,
      mobile_number: json.mobile_number,
      total_parcels: total,
      total_delivered: delivered,
      total_cancel: json.total_cancel || 0,
      apis: json.apis || {},
      deliveryRate,
      riskLevel,
      checkedAt: new Date().toISOString(),
     });
    } catch { resolve(null); }
   });
  });

  req.on('error', () => resolve(null));
  req.on('timeout', () => { req.destroy(); resolve(null); });
  req.write(body);
  req.end();
 });
}

/**
 * Run fraud check for a newly created order.
 * Reads config from the database — if not configured or disabled, silently skips.
 * Never throws — designed to be fire-and-forget.
 */
async function runFraudCheckForOrder(order) {
 try {
  // Lazy-load to avoid circular deps
  const { ShopConfig } = require('../models');
  const cfg = await ShopConfig.getConfig();

  if (!cfg.fraud_checker_enabled) return;        // Feature disabled in admin
  const apiKey = cfg.fraud_checker_api_key;
  if (!apiKey) return;                            // No API key configured — skip

  const phone = order.shipping_phone;
  if (!phone) return;                             // No phone number — skip

  const result = await callFraudApi(phone, apiKey);
  if (!result) return;

  await order.update({
   fraud_status: result,
   fraud_checked_at: new Date(),
  });

  console.log(`[FraudCheck] Order #${order.order_number} | ${phone} | Risk: ${result.riskLevel} | Rate: ${result.deliveryRate}%`);
 } catch (err) {
  console.error(`[FraudCheck] Failed for order ${order?.id}:`, err.message);
 }
}

module.exports = { callFraudApi, runFraudCheckForOrder };
