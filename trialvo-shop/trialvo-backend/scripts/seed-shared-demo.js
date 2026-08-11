/**
 * Seed Option 1 demo databases (same MySQL container, separate schemas).
 * Imports myecomv2.sql + trial_v1.sql into each target DB.
 * For techshop_demo / techshop_ecom, always runs product-3 replace-tech-catalog.js
 * after import (or when dump is skipped) so the storefront is gadgets, not fashion.
 *
 * Usage (after infra MySQL is healthy):
 *   node scripts/seed-shared-demo.js
 *   node scripts/seed-shared-demo.js lifestyle_demo fashion_demo
 *   node scripts/seed-shared-demo.js techshop_demo
 *
 * Prefers host `mysql` CLI; falls back to `docker exec` into trialvo-mysql.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { spawn, spawnSync } = require('child_process');

const LIFESTYLE_REPO = process.env.LIFESTYLE_REPO
  || path.resolve(__dirname, '../../../products/product-1-lifestyle');
const TECHSHOP_REPO = process.env.TECHSHOP_REPO
  || path.resolve(__dirname, '../../../products/product-3-tech-shop');

const baseCfg = {
  host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.SHARED_DEMO_DB_PORT || '3430', 10),
  user: process.env.SHARED_DEMO_DB_USER || 'root',
  password: process.env.SHARED_DEMO_DB_PASSWORD || 'localdev2026',
};

const DEFAULT_DBS = ['lifestyle_demo', 'fashion_demo', 'techshop_demo'];
const DB_CONTAINER = process.env.SHARED_DEMO_DB_CONTAINER || 'trialvo-mysql';

function hasHostMysql() {
  const r = spawnSync('mysql', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

async function waitForDb(retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const c = await mysql.createConnection(baseCfg);
      await c.query('SELECT 1');
      await c.end();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Shared demo MySQL not reachable');
}

function importViaHostMysql(filePath, database) {
  return new Promise((resolve, reject) => {
    const args = [
      `-h${baseCfg.host}`,
      `-P${baseCfg.port}`,
      `-u${baseCfg.user}`,
      `-p${baseCfg.password}`,
      database,
    ];
    const child = spawn('mysql', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    const stream = fs.createReadStream(filePath);
    stream.pipe(child.stdin);
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`mysql exit ${code} for ${filePath}`))));
  });
}

function importViaDocker(filePath, database) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'exec', '-i', DB_CONTAINER,
        'mysql', `-u${baseCfg.user}`, `-p${baseCfg.password}`, database,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] }
    );
    const stream = fs.createReadStream(filePath);
    stream.pipe(child.stdin);
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`docker mysql exit ${code} for ${filePath}`))));
  });
}

async function importSqlFile(filePath, database, useDocker) {
  if (useDocker) return importViaDocker(filePath, database);
  return importViaHostMysql(filePath, database);
}

function applyTechCatalog(database) {
  const script = path.join(TECHSHOP_REPO, 'Back End', 'scripts', 'replace-tech-catalog.js');
  if (!fs.existsSync(script)) {
    console.warn(`==> ${database}: tech replace script missing at ${script}`);
    return;
  }
  console.log(`==> ${database}: applying authentic tech catalog...`);
  const r = spawnSync(
    process.execPath,
    [script],
    {
      env: {
        ...process.env,
        DB_HOST: baseCfg.host,
        DB_PORT: String(baseCfg.port),
        DB_USER: baseCfg.user,
        DB_PASSWORD: baseCfg.password,
        DB_NAME: database,
      },
      stdio: 'inherit',
    }
  );
  if (r.status !== 0) {
    throw new Error(`tech catalog replace failed for ${database}`);
  }
}

async function seedDatabase(database, demo, trial, useDocker) {
  console.log(`\n==> Seeding ${database}`);
  const conn = await mysql.createConnection({ ...baseCfg, database });
  let skipped = false;
  try {
    const [rows] = await conn.query('SELECT COUNT(*) AS c FROM admins');
    if (Number(rows[0]?.c) > 0) {
      console.log(`==> ${database}: already seeded (admins present) — skip dump import`);
      skipped = true;
    }
  } catch {
    // table missing — continue import
  } finally {
    await conn.end();
  }

  if (!skipped) {
    console.log(`==> ${database}: importing demo dump...`);
    await importSqlFile(demo, database, useDocker);
    if (fs.existsSync(trial)) {
      console.log(`==> ${database}: importing trial_v1.sql...`);
      await importSqlFile(trial, database, useDocker);
    }
    console.log(`✅ ${database} seeded`);
  }

  // Tech shop must never keep the shared fashion dump as its storefront catalog.
  if (database === 'techshop_demo' || database === 'techshop_ecom') {
    applyTechCatalog(database);
  }
}

async function main() {
  const targets = process.argv.slice(2);
  const databases = targets.length ? targets : DEFAULT_DBS;

  console.log('==> Waiting for shared demo MySQL...');
  await waitForDb();

  const demo = path.join(LIFESTYLE_REPO, 'Back End', 'db backup', 'myecomv2.sql');
  const trial = path.join(LIFESTYLE_REPO, 'Back End', 'scripts', 'trial_v1.sql');
  if (!fs.existsSync(demo)) throw new Error(`Missing demo dump: ${demo}`);

  const useDocker = !hasHostMysql();
  console.log(useDocker
    ? `==> Import via docker exec (${DB_CONTAINER})`
    : '==> Import via host mysql CLI');
  console.log(`==> Targets: ${databases.join(', ')}`);

  for (const database of databases) {
    await seedDatabase(database, demo, trial, useDocker);
  }
  console.log('\n✅ All requested demo DBs seeded');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
