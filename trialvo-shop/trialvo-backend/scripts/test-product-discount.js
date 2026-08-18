/**
 * Local discount + trial-extend safety checks (no Pay charge).
 * Run: node scripts/test-product-discount.js
 */
require('dotenv').config();
const http = require('http');
const { quoteProduct, saleAmount } = require('../src/lib/productPricing');

function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
      });
    }).on('error', reject);
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log('PASS ', msg);
}

async function main() {
  const cases = [
    { list: 40000, pct: 25, sale: 30000 },
    { list: 40000, pct: 0, sale: 40000 },
    { list: 20000, pct: 10, sale: 18000 },
    { list: 60000, pct: 100, sale: 0 },
    { list: 19999, pct: 33.33, sale: 13333.33 },
  ];
  for (const c of cases) {
    const got = saleAmount(c.list, c.pct);
    assert(got === c.sale, `saleAmount(${c.list}, ${c.pct}) === ${c.sale} (got ${got})`);
  }

  const q = quoteProduct({ price_bdt: 40000, price_usd: 400, discount_percent: 25 });
  assert(q.saleBdt === 30000 && q.saleUsd === 300 && q.discountBdt === 10000, 'quote 25% off 40k/400');

  const health = await request('http://localhost:5000/api/health');
  assert(health.status === 200, 'CP /api/health 200');

  const products = JSON.parse((await request('http://localhost:5000/api/products')).body);
  assert(Array.isArray(products) && products.length >= 4, 'catalog has products');
  for (const p of products) {
    assert(p.discount_percent != null, `${p.slug} has discount_percent`);
    const quote = quoteProduct(p);
    assert(quote.saleBdt <= quote.listBdt, `${p.slug} sale <= list`);
    if (quote.saleBdt <= 0 && quote.hasDiscount) {
      throw new Error(`${p.slug} 100% discount would block checkout (sale 0)`);
    }
  }

  const cfg = JSON.parse((await request('http://localhost:5000/api/trial/config')).body);
  assert(Number(cfg.extendPriceBdt) > 0, 'trial extend pack price > 0');
  assert(Number(cfg.extendDays) > 0, 'trial extend days > 0');
  console.log('PASS  trial config', `৳${cfg.extendPriceBdt} / +${cfg.extendDays}d`);

  console.log('ALL DISCOUNT CHECKS PASSED');
}

main().catch((e) => {
  console.error('FAIL ', e.message || e);
  process.exit(1);
});
