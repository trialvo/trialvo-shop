/**
 * Smoke: multi-product trials + same product/option dedup.
 * Run with CP up: node scripts/test-multi-product-trial.js
 */
require('dotenv').config();
const http = require('http');
const { pool } = require('../src/config/db');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 30000,
    }, (res) => {
      let b = '';
      res.on('data', (d) => { b += d; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(b); } catch { /* ignore */ }
        resolve({ status: res.statusCode, json, body: b });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const products = await pool.query(
    `SELECT slug FROM products WHERE is_active = 1 AND is_trialable = 1 ORDER BY created_at LIMIT 2`
  );
  if (products.rows.length < 1) throw new Error('Need at least 1 trialable product');
  // Ensure second product exists for multi-product test
  if (products.rows.length < 2) {
    await pool.query('UPDATE products SET is_trialable = 1 WHERE is_active = 1 LIMIT 2');
  }
  const again = await pool.query(
    `SELECT slug FROM products WHERE is_active = 1 AND is_trialable = 1 ORDER BY created_at LIMIT 2`
  );
  const p1 = again.rows[0].slug;
  const p2 = again.rows[1]?.slug || again.rows[0].slug;
  const email = `multi-${Date.now()}@trialvo.demo`;
  const base = {
    name: 'Multi Test',
    email,
    phone: '01700000001',
  };

  console.log('Products:', p1, p2, 'email:', email);

  const r1 = await request('POST', '/api/trial/requests', {
    ...base, productSlug: p1, trialType: 'hosted',
  });
  console.log('1 hosted p1', r1.status, r1.json?.existing, r1.json?.status, r1.json?.autoApproved);
  if (r1.status !== 201 || r1.json?.existing) throw new Error('first hosted should create');

  // 2) Same email + same product + Option 1 again → existing
  const r2 = await request('POST', '/api/trial/requests', {
    ...base, productSlug: p1, trialType: 'hosted',
  });
  console.log('2 hosted p1 again', r2.status, r2.json?.existing, r2.json?.message);
  if (!r2.json?.existing || r2.json.statusToken !== r1.json.statusToken) {
    throw new Error('duplicate hosted same product should return same status token');
  }

  // 3) Same product Option 2 should be allowed (new request)
  const r3 = await request('POST', '/api/trial/requests', {
    ...base, productSlug: p1, trialType: 'self_hosted', desiredDomain: 'multi-test.example.com',
  });
  console.log('3 self_hosted p1', r3.status, r3.json?.existing, r3.json?.status);
  if (r3.status !== 201 || r3.json?.existing) throw new Error('opt2 same product should create');
  if (r3.json.statusToken === r1.json.statusToken) throw new Error('opt2 must have different status token');

  // 4) Option 2 again → existing
  const r4 = await request('POST', '/api/trial/requests', {
    ...base, productSlug: p1, trialType: 'self_hosted', desiredDomain: 'multi-test.example.com',
  });
  console.log('4 self_hosted p1 again', r4.status, r4.json?.existing);
  if (!r4.json?.existing || r4.json.statusToken !== r3.json.statusToken) {
    throw new Error('duplicate self_hosted should return previous');
  }

  // 5) Different product Option 1 allowed (if we have 2 products)
  if (p2 !== p1) {
    const r5 = await request('POST', '/api/trial/requests', {
      ...base, productSlug: p2, trialType: 'hosted',
    });
    console.log('5 hosted p2', r5.status, r5.json?.existing, r5.json?.status);
    if (r5.status !== 201 || r5.json?.existing) throw new Error('other product hosted should create');
  } else {
    console.log('5 skip (only one trialable product)');
  }

  console.log('\n✅ Multi-product / per-option dedup OK');
  await pool.end();
})().catch(async (e) => {
  console.error('ERROR:', e.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
