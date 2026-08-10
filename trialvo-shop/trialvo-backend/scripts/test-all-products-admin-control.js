/**
 * CP admin freeze/unfreeze for all 4 shared-demo products.
 * Usage: SHARED_DEMO_ENABLED=1 node scripts/test-all-products-admin-control.js
 */
require('dotenv').config();
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const { randomToken } = require('../src/utils/crypto');
const { provisionFromRequest } = require('../src/services/provisioner');

const CP = process.env.CP_BASE_URL || 'http://127.0.0.1:5000';

const PRODUCTS = [
  { slug: 'lifestyle-ecommerce', apiPort: 9100, schema: 'legacy' },
  { slug: 'fashion-ecommerce', apiPort: 9101, schema: 'legacy' },
  { slug: 'tech-shop-ecommerce', apiPort: 9102, schema: 'legacy' },
  { slug: 'combo-basket-ecommerce', apiPort: 9103, schema: 'combo' },
];

function req(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = opts.body ? JSON.stringify(opts.body) : null;
    const headers = { ...(opts.headers || {}) };
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    const r = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers,
      timeout: 20000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let json = null;
        const text = Buffer.concat(chunks).toString('utf8');
        try { json = JSON.parse(text); } catch { /* */ }
        resolve({ status: res.statusCode, text, json });
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function productAdminLogin(p, email, password) {
  if (p.schema === 'combo') {
    return req(`http://127.0.0.1:${p.apiPort}/api/admin/auth/login`, {
      method: 'POST',
      body: { email, password },
    });
  }
  // Legacy products — any gated route proves API alive; login path varies by build
  return req(`http://127.0.0.1:${p.apiPort}/api/v1/admin/auth/login`, {
    method: 'POST',
    body: { email, password },
  }).catch(() => ({ status: 0 }));
}

function loginOk(p, res) {
  if (p.schema === 'combo') return res.status === 200 && res.json?.token;
  return res.status === 200 || res.status === 401 || res.status === 404;
}

function loginBlocked(res) {
  return res.status === 403 || res.status === 401;
}

async function main() {
  process.env.SHARED_DEMO_ENABLED = '1';
  const fails = [];

  const cpLogin = await req(`${CP}/api/auth/login`, {
    method: 'POST',
    body: { email: 'admin@trialvo.com', password: 'Antor@123' },
  });
  const token = cpLogin.json?.token;
  if (!token) {
    console.error('FAIL cp-admin-login', cpLogin.status, cpLogin.text?.slice(0, 120));
    process.exit(1);
  }
  console.log('PASS cp-admin-login');
  const auth = { Authorization: `Bearer ${token}` };

  for (const p of PRODUCTS) {
    console.log(`\n--- ${p.slug} ---`);
    const { rows: prods } = await pool.query('SELECT id FROM products WHERE slug = $1', [p.slug]);
    if (!prods[0]) {
      console.error(`FAIL ${p.slug} product-missing`);
      fails.push(p.slug);
      continue;
    }

    const email = `cp-admin-test-${p.slug}-${Date.now()}@trialvo.demo`;
    const reqId = uuidv4();
    const publicToken = randomToken(24);
    await pool.query(
      `INSERT INTO trial_requests (id, public_token, product_id, trial_type, customer_name, email, phone, requested_days)
       VALUES ($1,$2,$3,'hosted','CP Admin Test',$4,'01700000099',14)`,
      [reqId, publicToken, prods[0].id, email]
    );

    let prov;
    try {
      prov = await provisionFromRequest({
        id: reqId,
        public_token: publicToken,
        product_id: prods[0].id,
        trial_type: 'hosted',
        customer_name: 'CP Admin Test',
        email,
        phone: '01700000099',
        product_slug: p.slug,
      }, 14);
    } catch (e) {
      console.error(`FAIL ${p.slug} provision`, e.message);
      fails.push(p.slug);
      continue;
    }
    console.log(`PASS ${p.slug} provision`);

    const list = await req(`${CP}/api/admin/trial-instances?scope=trials`, { headers: auth });
    const inst = (list.json || []).find((r) => r.id === prov.instanceId);
    if (!inst || inst.product_slug !== p.slug) {
      console.error(`FAIL ${p.slug} instance-list`);
      fails.push(p.slug);
      continue;
    }
    if (!inst.meta?.sharedDemo) {
      console.error(`FAIL ${p.slug} sharedDemo-meta`);
      fails.push(p.slug);
      continue;
    }
    console.log(`PASS ${p.slug} instance-listed`);

    const fr = await req(`${CP}/api/admin/trial-instances/${prov.instanceId}/freeze`, {
      method: 'POST',
      headers: auth,
      body: {},
    });
    if (!fr.json?.ok || !fr.json?.sharedDemo) {
      console.error(`FAIL ${p.slug} freeze`, fr.text?.slice(0, 120));
      fails.push(p.slug);
      continue;
    }
    console.log(`PASS ${p.slug} admin-freeze`);

    if (p.schema === 'combo') {
      const blocked = await productAdminLogin(p, prov.adminEmail, prov.adminPassword);
      if (!loginBlocked(blocked)) {
        console.error(`FAIL ${p.slug} login-blocked-after-freeze`, blocked.status);
        fails.push(p.slug);
        continue;
      }
      console.log(`PASS ${p.slug} combo-login-blocked`);
    }

    const uf = await req(`${CP}/api/admin/trial-instances/${prov.instanceId}/unfreeze`, {
      method: 'POST',
      headers: auth,
      body: {},
    });
    if (!uf.json?.ok || !uf.json?.sharedDemo) {
      console.error(`FAIL ${p.slug} unfreeze`, uf.text?.slice(0, 120));
      fails.push(p.slug);
      continue;
    }
    console.log(`PASS ${p.slug} admin-unfreeze`);

    if (p.schema === 'combo') {
      const ok = await productAdminLogin(p, prov.adminEmail, prov.adminPassword);
      if (!loginOk(p, ok)) {
        console.error(`FAIL ${p.slug} login-after-unfreeze`, ok.status);
        fails.push(p.slug);
        continue;
      }
      console.log(`PASS ${p.slug} combo-login-restored`);
    }

    await pool.query(
      "UPDATE trial_instances SET status = 'destroyed', updated_at = NOW() WHERE id = $1",
      [prov.instanceId]
    );
  }

  await pool.end();
  console.log('\n========================================');
  if (fails.length) {
    console.error('FAILURES:', fails);
    process.exit(1);
  }
  console.log('ALL PRODUCTS CP ADMIN CONTROL TESTS PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
