/**
 * One-shot: upsert Lifestyle/Fashion/Tech product deploy_config for per-product demos.
 * Usage: node scripts/reseed-demo-product-urls.js
 */
require('dotenv').config();
const { pool } = require('../src/config/db');

async function main() {
  const seeds = [
    require('../src/seeds/lifestyleProductSeed'),
    require('../src/seeds/fashionProductSeed'),
    require('../src/seeds/techShopProductSeed'),
    require('../src/seeds/comboBasketProductSeed'),
  ];
  const client = { query: (...a) => pool.query(...a) };
  for (const s of seeds) {
    await s.run(client);
    console.log('seeded', s.table || 'products');
  }
  const { rows } = await pool.query(
    `SELECT slug,
            JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_db_name')) AS db,
            JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_admin_url')) AS admin,
            JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_api_url')) AS api,
            JSON_UNQUOTE(JSON_EXTRACT(deploy_config, '$.shared_demo_shop_url')) AS shop
     FROM products
     WHERE slug IN ('lifestyle-ecommerce','fashion-ecommerce','tech-shop-ecommerce','combo-basket-ecommerce')
     ORDER BY slug`
  );
  console.table(rows);
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
