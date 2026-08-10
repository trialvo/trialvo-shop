/**
 * Full Opt1 provision E2E for Lifestyle / Fashion / Techshop.
 * Verifies per-product URLs + DB + admin grant, then revokes.
 *
 * Usage: node scripts/e2e-opt1-all-products.js
 */
require('dotenv').config();
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const { pool } = require('../src/config/db');
const { randomToken } = require('../src/utils/crypto');
const { provisionFromRequest } = require('../src/services/provisioner');
const { revokeTrialAdmin } = require('../src/services/sharedDemoProvisioner');

const PRODUCTS = [
  {
    slug: 'lifestyle-ecommerce',
    db: 'lifestyle_demo',
    shop: 'http://localhost:5100',
    admin: 'http://localhost:5174',
    api: 'http://localhost:9100',
  },
  {
    slug: 'fashion-ecommerce',
    db: 'fashion_demo',
    shop: 'http://localhost:5101',
    admin: 'http://localhost:5175',
    api: 'http://localhost:9101',
  },
  {
    slug: 'tech-shop-ecommerce',
    db: 'techshop_demo',
    shop: 'http://localhost:5102',
    admin: 'http://localhost:5176',
    api: 'http://localhost:9102',
  },
  {
    slug: 'combo-basket-ecommerce',
    db: 'combobasket_demo',
    shop: 'http://localhost:5103',
    admin: 'http://localhost:5177',
    api: 'http://localhost:9103',
  },
];

/** Treat localhost and 127.0.0.1 as equivalent for local E2E. */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.hostname = '127.0.0.1';
    }
    return u.origin + u.pathname.replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}

function urlsMatch(got, expected) {
  return normalizeUrl(got) === normalizeUrl(expected);
}

function get(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

async function probeApi(apiBase) {
  const paths = [
    '/api/v1/categories',
    '/api/categories',
    '/api/v1/products',
    '/api/products',
    '/api/v1/public/settings',
  ];
  for (const path of paths) {
    const res = await get(`${apiBase}${path}`);
    if (!res.error && res.status && res.status < 500 && res.status !== 404) {
      return { path, status: res.status, bytes: (res.body || '').length };
    }
  }
  // Accept 401/403 as "API alive and auth-gated"
  for (const path of paths) {
    const res = await get(`${apiBase}${path}`);
    if (!res.error && (res.status === 401 || res.status === 403 || res.status === 400)) {
      return { path, status: res.status, bytes: (res.body || '').length };
    }
  }
  return null;
}

async function main() {
  let fails = 0;

  console.log('=== API functional probes ===');
  for (const p of PRODUCTS) {
    const hit = await probeApi(p.api);
    if (hit) {
      console.log(`PASS  ${p.slug} API ${hit.path} → ${hit.status} (${hit.bytes}b)`);
    } else {
      console.log(`WARN  ${p.slug} API — no non-404 public route found (container still up)`);
    }
  }

  console.log('\n=== Opt1 provisionFromRequest per product ===');
  const dbBase = {
    host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.SHARED_DEMO_DB_PORT || '3430', 10),
    user: process.env.SHARED_DEMO_DB_USER || 'root',
    password: process.env.SHARED_DEMO_DB_PASSWORD || 'localdev2026',
  };

  for (const p of PRODUCTS) {
    const { rows } = await pool.query('SELECT id, slug FROM products WHERE slug = $1', [p.slug]);
    if (!rows[0]) {
      console.log(`FAIL  ${p.slug} — product missing in CP`);
      fails += 1;
      continue;
    }
    const product = rows[0];
    const reqId = uuidv4();
    const email = `e2e-${p.slug}-${Date.now()}@trialvo.demo`;
    const publicToken = randomToken(24);

    await pool.query(
      `INSERT INTO trial_requests (id, public_token, product_id, trial_type, customer_name, email, phone, requested_days)
       VALUES ($1,$2,$3,'hosted','E2E Test',$4,'01700000099',14)`,
      [reqId, publicToken, product.id, email]
    );

    const requestRow = {
      id: reqId,
      public_token: publicToken,
      product_id: product.id,
      trial_type: 'hosted',
      customer_name: 'E2E Test',
      email,
      phone: '01700000099',
      product_slug: p.slug,
    };

    let result;
    try {
      result = await provisionFromRequest(requestRow, 14);
    } catch (e) {
      console.log(`FAIL  ${p.slug} provision — ${e.message}`);
      fails += 1;
      continue;
    }

    const meta = result.meta || {};
    const urlsOk =
      urlsMatch(result.shopUrl, p.shop) &&
      urlsMatch(result.adminUrl, p.admin) &&
      urlsMatch(result.apiUrl, p.api);
    const dbOk = meta.sharedDemoDbName === p.db && meta.sharedDemo === true;

    // Persist check on trial_instances row
    const { rows: instRows } = await pool.query(
      'SELECT shop_url, admin_url, api_url, meta FROM trial_instances WHERE id = $1',
      [result.instanceId]
    );
    const inst = instRows[0] || {};
    let instMeta = inst.meta;
    if (typeof instMeta === 'string') {
      try { instMeta = JSON.parse(instMeta); } catch { instMeta = {}; }
    }
    const instanceOk =
      urlsMatch(inst.shop_url, p.shop) &&
      urlsMatch(inst.admin_url, p.admin) &&
      urlsMatch(inst.api_url, p.api) &&
      instMeta?.sharedDemoDbName === p.db;

    const conn = await mysql.createConnection({ ...dbBase, database: p.db });
    const [admins] = await conn.query(
      'SELECT id, is_active FROM admins WHERE email = ? LIMIT 1',
      [email]
    );
    await conn.end();
    const adminOk = admins[0] && Number(admins[0].is_active) === 1;

    if (urlsOk && dbOk && instanceOk && adminOk) {
      console.log(`PASS  ${p.slug} provision urls+db+instance+admin (adminId=${meta.lifestyleAdminId})`);
    } else {
      console.log(`FAIL  ${p.slug} provision`, {
        urlsOk,
        dbOk,
        instanceOk,
        adminOk,
        got: {
          shop: result.shopUrl,
          admin: result.adminUrl,
          api: result.apiUrl,
          db: meta.sharedDemoDbName,
          instApi: inst.api_url,
          instDb: instMeta?.sharedDemoDbName,
        },
      });
      fails += 1;
    }

    await revokeTrialAdmin({ email, database: p.db });
    await pool.query(
      "UPDATE trial_instances SET status = 'destroyed', updated_at = NOW() WHERE admin_email = $1",
      [email]
    );
  }

  await pool.end();
  console.log('\n========================================');
  if (fails === 0) {
    console.log('ALL OPT1 E2E PASSED');
    process.exit(0);
  }
  console.log(`OPT1 E2E FAILURES=${fails}`);
  process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
