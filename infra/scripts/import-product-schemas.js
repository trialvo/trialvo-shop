/**
 * Import product schema dump into one or more DBs on the shared MySQL.
 * Usage:
 *   node infra/scripts/import-product-schemas.js
 *   node infra/scripts/import-product-schemas.js lifestyle_ecom fashion_ecom
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const DUMP = path.join(ROOT, 'products', 'product-1-lifestyle', 'Back End', 'db backup', 'myecomv2.sql');
const CONTAINER = process.env.MYSQL_CONTAINER || 'trialvo-mysql';
const ROOT_PW = process.env.MYSQL_ROOT_PASSWORD || 'localdev2026';

const DEFAULT_DBS = ['lifestyle_ecom', 'fashion_ecom', 'techshop_ecom', 'lifestyle_demo'];
const targets = process.argv.slice(2);
const dbs = targets.length ? targets : DEFAULT_DBS;

function importDb(dbName) {
  return new Promise((resolve, reject) => {
    console.log(`==> Importing ${DUMP} → ${dbName}`);
    const child = spawn(
      'docker',
      ['exec', '-i', CONTAINER, 'mysql', `-uroot`, `-p${ROOT_PW}`, dbName],
      { stdio: ['pipe', 'inherit', 'inherit'] }
    );
    fs.createReadStream(DUMP).pipe(child.stdin);
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`import failed for ${dbName} (exit ${code})`))
    );
  });
}

async function main() {
  if (!fs.existsSync(DUMP)) throw new Error(`Missing dump: ${DUMP}`);
  for (const db of dbs) {
    await importDb(db);
  }
  console.log('✅ Product schemas imported:', dbs.join(', '));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
