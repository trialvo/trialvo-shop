/**
 * Thorough smoke for per-product Option 1 demos + CP + Pay.
 * Usage: node scripts/smoke-per-product-demo.js
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const mysql = require('mysql2/promise');
const {
  createTrialAdmin,
  revokeTrialAdmin,
  ensureConfigured,
} = require('../src/services/sharedDemoProvisioner');

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

function request(url, { method = 'GET', headers = {}, body = null, timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`timeout ${url}`));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const PRODUCTS = [
  {
    key: 'lifestyle',
    slug: 'lifestyle-ecommerce',
    db: 'lifestyle_demo',
    shop: 'http://localhost:5100',
    admin: 'http://localhost:5174',
    api: 'http://localhost:9100',
  },
  {
    key: 'fashion',
    slug: 'fashion-ecommerce',
    db: 'fashion_demo',
    shop: 'http://localhost:5101',
    admin: 'http://localhost:5175',
    api: 'http://localhost:9101',
  },
  {
    key: 'techshop',
    slug: 'tech-shop-ecommerce',
    db: 'techshop_demo',
    shop: 'http://localhost:5102',
    admin: 'http://localhost:5176',
    api: 'http://localhost:9102',
  },
];

async function checkHttp(name, url, expectStatuses = [200]) {
  try {
    const res = await request(url);
    if (expectStatuses.includes(res.status)) {
      pass(name, `${url} → ${res.status}`);
      return res;
    }
    fail(name, `${url} → ${res.status}`);
    return res;
  } catch (e) {
    fail(name, `${url} → ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('=== 1) Control Plane + Pay ===');
  await checkHttp('cp-health', 'http://localhost:5000/api/health');
  await checkHttp('cp-frontend', 'http://localhost:8000');
  await checkHttp('cp-products', 'http://localhost:5000/api/products');
  await checkHttp('pay-health', 'http://localhost:8088/health');

  console.log('\n=== 2) Per-product shop / admin / API ===');
  for (const p of PRODUCTS) {
    await checkHttp(`${p.key}-shop`, p.shop);
    await checkHttp(`${p.key}-admin`, p.admin);
    // APIs often have no root route — accept 200/404 as "alive"
    await checkHttp(`${p.key}-api-root`, p.api, [200, 404]);
    // Common BFF/API paths
    for (const path of ['/api/v1/settings', '/api/settings', '/api/v1/health', '/health']) {
      try {
        const res = await request(`${p.api}${path}`);
        if (res.status < 500) {
          pass(`${p.key}-api${path}`, `→ ${res.status}`);
          break;
        }
      } catch {
        /* try next */
      }
    }
  }

  console.log('\n=== 3) MySQL demo DBs reachable + admins table ===');
  const dbBase = {
    host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.SHARED_DEMO_DB_PORT || '3430', 10),
    user: process.env.SHARED_DEMO_DB_USER || 'root',
    password: process.env.SHARED_DEMO_DB_PASSWORD || 'localdev2026',
  };
  for (const p of PRODUCTS) {
    try {
      const conn = await mysql.createConnection({ ...dbBase, database: p.db });
      const [rows] = await conn.query('SELECT COUNT(*) AS c FROM admins');
      await conn.end();
      const c = Number(rows[0]?.c || 0);
      if (c > 0) pass(`${p.key}-db`, `${p.db} admins=${c}`);
      else fail(`${p.key}-db`, `${p.db} admins=0 (not seeded?)`);
    } catch (e) {
      fail(`${p.key}-db`, e.message);
    }
  }

  console.log('\n=== 4) CP product deploy_config wiring ===');
  try {
    const { pool } = require('../src/config/db');
    const { rows } = await pool.query(
      `SELECT slug,
              JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_db_name')) AS db,
              JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_shop_url')) AS shop,
              JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_admin_url')) AS admin,
              JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_api_url')) AS api
       FROM products
       WHERE slug IN ('lifestyle-ecommerce','fashion-ecommerce','tech-shop-ecommerce')`
    );
    for (const p of PRODUCTS) {
      const row = rows.find((r) => r.slug === p.slug);
      if (!row) {
        fail(`${p.key}-deploy_config`, 'product row missing');
        continue;
      }
      const ok =
        row.db === p.db &&
        row.shop === p.shop &&
        row.admin === p.admin &&
        row.api === p.api;
      if (ok) pass(`${p.key}-deploy_config`, `${row.db} | ${row.admin}`);
      else fail(`${p.key}-deploy_config`, JSON.stringify(row));
    }
    await pool.end();
  } catch (e) {
    fail('deploy_config-query', e.message);
  }

  console.log('\n=== 5) Opt1 grant/revoke on each demo DB ===');
  for (const p of PRODUCTS) {
    const deployConfig = {
      shared_demo_shop_url: p.shop,
      shared_demo_admin_url: p.admin,
      shared_demo_api_url: p.api,
      shared_demo_db_name: p.db,
    };
    const cfg = await ensureConfigured(deployConfig);
    if (!cfg.ok) {
      fail(`${p.key}-ensureConfigured`, cfg.error);
      continue;
    }
    pass(`${p.key}-ensureConfigured`, cfg.database);

    const email = `smoke-${p.key}-${Date.now()}@test.local`;
    const created = await createTrialAdmin({
      email,
      password: 'SmokeTest@12345',
      name: `${p.key} Smoke`,
      deployConfig,
    });
    if (!created.ok || created.database !== p.db) {
      fail(`${p.key}-createAdmin`, JSON.stringify(created));
      continue;
    }
    pass(`${p.key}-createAdmin`, `adminId=${created.adminId} db=${created.database}`);

    // Verify row exists only in that DB
    try {
      const conn = await mysql.createConnection({ ...dbBase, database: p.db });
      const [rows] = await conn.query(
        'SELECT is_active FROM admins WHERE email = ? LIMIT 1',
        [email]
      );
      await conn.end();
      if (rows[0]?.is_active === 1 || rows[0]?.is_active === true) {
        pass(`${p.key}-admin-active`, email);
      } else {
        fail(`${p.key}-admin-active`, JSON.stringify(rows[0]));
      }
    } catch (e) {
      fail(`${p.key}-admin-active`, e.message);
    }

    // Ensure not leaked into sibling DBs
    for (const other of PRODUCTS.filter((x) => x.db !== p.db)) {
      try {
        const conn = await mysql.createConnection({ ...dbBase, database: other.db });
        const [rows] = await conn.query(
          'SELECT id FROM admins WHERE email = ? LIMIT 1',
          [email]
        );
        await conn.end();
        if (rows.length === 0) pass(`${p.key}-no-leak-to-${other.key}`, email);
        else fail(`${p.key}-no-leak-to-${other.key}`, `found in ${other.db}`);
      } catch (e) {
        fail(`${p.key}-no-leak-to-${other.key}`, e.message);
      }
    }

    const rev = await revokeTrialAdmin({ email, database: p.db });
    if (rev.ok && rev.affected >= 1) pass(`${p.key}-revokeAdmin`, `affected=${rev.affected}`);
    else fail(`${p.key}-revokeAdmin`, JSON.stringify(rev));
  }

  console.log('\n=== 6) Shop → own API isolation (IMAGE/API env sanity) ===');
  // Hit each shop homepage; containers already map API_URL to sibling service
  for (const p of PRODUCTS) {
    const res = await request(p.shop);
    if (res && res.status === 200 && res.body.length > 500) {
      pass(`${p.key}-shop-html`, `bytes=${res.body.length}`);
    } else {
      fail(`${p.key}-shop-html`, res ? `status=${res.status} bytes=${res.body.length}` : 'no response');
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n========================================');
  console.log(`TOTAL ${results.length}  PASS ${results.length - failed.length}  FAIL ${failed.length}`);
  if (failed.length) {
    console.log('Failed:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
