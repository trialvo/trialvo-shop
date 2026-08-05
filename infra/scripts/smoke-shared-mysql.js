/**
 * Smoke test: shared MySQL + CP + 3 product APIs
 */
const mysql = require('mysql2/promise');
const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    }).on('error', reject);
  });
}

async function postJson(url, data) {
  const u = new URL(url);
  const payload = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const fails = [];
  const ok = (msg) => console.log('✅', msg);
  const bad = (msg) => {
    console.log('❌', msg);
    fails.push(msg);
  };

  // 1) Shared MySQL DBs
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3430,
    user: 'root',
    password: 'localdev2026',
  });
  const [dbs] = await conn.query(
    `SELECT SCHEMA_NAME AS db FROM information_schema.SCHEMATA
     WHERE SCHEMA_NAME IN ('trialvo_shop','lifestyle_ecom','fashion_ecom','techshop_ecom','lifestyle_demo')
     ORDER BY SCHEMA_NAME`
  );
  if (dbs.length === 5) ok(`Shared MySQL has 5 DBs: ${dbs.map((d) => d.db).join(', ')}`);
  else bad(`Expected 5 DBs, got ${dbs.length}`);

  for (const name of ['lifestyle_ecom', 'fashion_ecom', 'techshop_ecom', 'lifestyle_demo']) {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema=? AND table_name='admins'`,
      [name]
    );
    if (Number(rows[0].c) === 1) ok(`${name}.admins exists`);
    else bad(`${name}.admins missing`);
  }

  const [cpProducts] = await conn.query(
    `SELECT slug, is_trialable, is_active FROM trialvo_shop.products
     WHERE slug IN ('lifestyle-ecommerce','fashion-ecommerce','tech-shop-ecommerce')
     ORDER BY slug`
  );
  console.log('CP products:', cpProducts);
  if (cpProducts.length === 3 && cpProducts.every((p) => Number(p.is_trialable) === 1)) {
    ok('CP catalog: lifestyle + fashion + tech-shop trialable');
  } else bad('CP catalog missing trialable products');
  await conn.end();

  // 2) HTTP health
  const endpoints = [
    ['CP health', 'http://127.0.0.1:5000/api/health'],
    ['CP products', 'http://127.0.0.1:5000/api/products'],
    ['Lifestyle API', 'http://127.0.0.1:9000/api/v1/delivery-areas'],
    ['Fashion API', 'http://127.0.0.1:9001/api/v1/delivery-areas'],
    ['Tech API', 'http://127.0.0.1:9002/api/v1/delivery-areas'],
  ];

  for (const [label, url] of endpoints) {
    try {
      const r = await get(url);
      if (r.status >= 200 && r.status < 500) ok(`${label} → HTTP ${r.status}`);
      else bad(`${label} → HTTP ${r.status}`);
    } catch (e) {
      // health path may 404 — try root or config
      bad(`${label} → ${e.message}`);
    }
  }

  // Products list must include fashion + tech
  const prodRes = await get('http://127.0.0.1:5000/api/products');
  let products = [];
  try {
    products = JSON.parse(prodRes.body);
  } catch {
    bad('CP /api/products not JSON');
  }
  const slugs = (Array.isArray(products) ? products : []).map((p) => p.slug);
  for (const s of ['lifestyle-ecommerce', 'fashion-ecommerce', 'tech-shop-ecommerce']) {
    if (slugs.includes(s)) ok(`API lists ${s}`);
    else bad(`API missing ${s}`);
  }

  // 3) Fashion Opt2 trial request (self_hosted)
  const trial = await postJson('http://127.0.0.1:5000/api/trial/requests', {
    productSlug: 'fashion-ecommerce',
    trialType: 'self_hosted',
    name: 'Shared Mysql Test',
    email: `fashion-smoke-${Date.now()}@example.com`,
    phone: '01700000000',
    desiredDomain: 'fashion-smoke.example.com',
  });
  console.log('Fashion Opt2 trial status', trial.status, trial.body.slice(0, 200));
  if (trial.status === 200 || trial.status === 201) ok('Fashion Opt2 trial request accepted');
  else bad(`Fashion Opt2 trial failed: ${trial.status}`);

  // 4) Fashion Opt1 should be rejected
  const opt1 = await postJson('http://127.0.0.1:5000/api/trial/requests', {
    productSlug: 'fashion-ecommerce',
    trialType: 'hosted',
    name: 'Shared Mysql Test',
    email: `fashion-opt1-${Date.now()}@example.com`,
    phone: '01700000000',
  });
  if (opt1.status === 400) ok('Fashion Opt1 correctly rejected (unsupported)');
  else bad(`Fashion Opt1 expected 400, got ${opt1.status}`);

  // 5) Tech Opt2
  const tech = await postJson('http://127.0.0.1:5000/api/trial/requests', {
    productSlug: 'tech-shop-ecommerce',
    trialType: 'self_hosted',
    name: 'Shared Mysql Test',
    email: `tech-smoke-${Date.now()}@example.com`,
    phone: '01700000001',
    desiredDomain: 'tech-smoke.example.com',
  });
  if (tech.status === 200 || tech.status === 201) ok('Tech Opt2 trial request accepted');
  else bad(`Tech Opt2 trial failed: ${tech.status} ${tech.body.slice(0, 120)}`);

  if (fails.length) {
    console.log('\nFAILED:', fails.length);
    process.exit(1);
  }
  console.log('\nALL_SMOKE_OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
