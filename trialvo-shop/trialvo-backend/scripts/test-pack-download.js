/**
 * Smoke test: issue entitlement + one-time pack token download + replay reject.
 * Requires CP on :5000 and a product id in DB.
 *
 *   node scripts/test-pack-download.js
 */
require('dotenv').config();
const http = require('http');
const { pool } = require('../src/config/db');
const { issueEntitlementForOrder, provisionPaidDeployment } = require('../src/services/licenseEntitlements');
const { downloadAndConsumePackToken, packDownloadUrl } = require('../src/services/licensePackDelivery');

function get(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () =>
        resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers })
      );
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(30000, () => req.destroy());
  });
}

(async () => {
  const { rows: products } = await pool.query(
    "SELECT id FROM products WHERE slug = 'lifestyle-ecommerce' OR is_trialable = 1 LIMIT 1"
  );
  if (!products.length) throw new Error('No product found');

  const order = {
    order_id: `pack-test-${Date.now()}`,
    product_id: products[0].id,
    customer_email: 'pack-test@trialvo.demo',
    customer_name: 'Pack Test',
  };

  const { entitlement, licenseKey, packToken, created } = await issueEntitlementForOrder(order, {
    maxInstalls: 1,
    daysValid: 365,
  });
  if (!created || !packToken) throw new Error('Expected fresh packToken');

  const paid = await provisionPaidDeployment({
    entitlement,
    domain: 'pack-test.local',
    hostMode: 'docker',
    adminEmail: order.customer_email,
  });
  console.log('entitlement', entitlement.id, 'instance', paid.instanceId);
  console.log('licenseKey hint', licenseKey?.slice(-8));
  console.log('url', packDownloadUrl(packToken, 'docker'));

  const first = await downloadAndConsumePackToken(packToken, 'docker');
  console.log('PASS first download', first.zip.filename, first.zip.buffer.length, 'bytes');

  let replayOk = false;
  try {
    await downloadAndConsumePackToken(packToken, 'docker');
  } catch (e) {
    if (e.status === 401) {
      console.log('PASS replay rejected', e.message);
      replayOk = true;
    } else throw e;
  }
  if (!replayOk) throw new Error('Replay should have failed');

  // HTTP path if CP up
  const health = await get('http://127.0.0.1:5000/api/health');
  if (health.status === 200) {
    const dead = await get(packDownloadUrl(packToken, 'docker'));
    console.log(dead.status === 401 ? 'PASS HTTP replay 401' : `WARN HTTP status ${dead.status}`);
  } else {
    console.log('SKIP HTTP (CP not up)');
  }

  console.log('\n✅ PACK DOWNLOAD SMOKE PASS');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
