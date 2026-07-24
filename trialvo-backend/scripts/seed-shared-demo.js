/**
 * One-time seed for the shared Lifestyle demo stack.
 * Imports myecomv2.sql + trial_v1.sql into SHARED_DEMO MySQL.
 *
 * Usage (after compose is healthy):
 *   node scripts/seed-shared-demo.js
 *
 * Prefers host `mysql` CLI; falls back to `docker exec` into the demo DB container
 * (needed on Windows machines without MySQL client tools).
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { spawn, spawnSync } = require('child_process');

const LIFESTYLE_REPO = process.env.LIFESTYLE_REPO
  || path.resolve(__dirname, '../../../product 1 life style');

const cfg = {
  host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.SHARED_DEMO_DB_PORT || '23307', 10),
  user: process.env.SHARED_DEMO_DB_USER || 'root',
  password: process.env.SHARED_DEMO_DB_PASSWORD || 'sharedDemoRoot2026',
  database: process.env.SHARED_DEMO_DB_NAME || 'ecom',
};

const DB_CONTAINER = process.env.SHARED_DEMO_DB_CONTAINER || 'lifestyle-shared-demo-db';

function hasHostMysql() {
  const r = spawnSync('mysql', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

async function waitForDb(retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const c = await mysql.createConnection({ ...cfg, database: undefined });
      await c.query('SELECT 1');
      await c.end();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Shared demo MySQL not reachable');
}

function importViaHostMysql(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      `-h${cfg.host}`,
      `-P${cfg.port}`,
      `-u${cfg.user}`,
      `-p${cfg.password}`,
      cfg.database,
    ];
    const child = spawn('mysql', args, { stdio: ['pipe', 'inherit', 'inherit'] });
    const stream = fs.createReadStream(filePath);
    stream.pipe(child.stdin);
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`mysql exit ${code} for ${filePath}`))));
  });
}

function importViaDocker(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'exec', '-i', DB_CONTAINER,
        'mysql', `-u${cfg.user}`, `-p${cfg.password}`, cfg.database,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] }
    );
    const stream = fs.createReadStream(filePath);
    stream.pipe(child.stdin);
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`docker mysql exit ${code} for ${filePath}`))));
  });
}

async function importSqlFile(filePath, useDocker) {
  if (useDocker) return importViaDocker(filePath);
  return importViaHostMysql(filePath);
}

async function main() {
  console.log('==> Waiting for shared demo MySQL...');
  await waitForDb();

  const demo = path.join(LIFESTYLE_REPO, 'Back End', 'db backup', 'myecomv2.sql');
  const trial = path.join(LIFESTYLE_REPO, 'Back End', 'scripts', 'trial_v1.sql');
  if (!fs.existsSync(demo)) throw new Error(`Missing demo dump: ${demo}`);

  // Skip if already seeded (admins table has rows)
  const conn = await mysql.createConnection(cfg);
  try {
    const [rows] = await conn.query('SELECT COUNT(*) AS c FROM admins');
    if (Number(rows[0]?.c) > 0) {
      console.log('==> Already seeded (admins present) — skip import');
      return;
    }
  } catch {
    // table missing — continue import
  } finally {
    await conn.end();
  }

  const useDocker = !hasHostMysql();
  console.log(useDocker
    ? `==> Import via docker exec (${DB_CONTAINER})`
    : '==> Import via host mysql CLI');

  console.log('==> Importing demo dump (large)...');
  await importSqlFile(demo, useDocker);
  if (fs.existsSync(trial)) {
    console.log('==> Importing trial_v1.sql...');
    await importSqlFile(trial, useDocker);
  }
  console.log('✅ Shared demo DB seeded');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
