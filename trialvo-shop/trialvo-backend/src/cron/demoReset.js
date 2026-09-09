const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { pool } = require('../config/db');
const { decrypt } = require('../utils/crypto');
const { logEvent } = require('../services/trialEvents');
const { getTrialSettings } = require('../services/trialSettings');
const {
  getDbConfig,
  resolveDemoDbName,
  createTrialAdmin,
  parseInstanceMeta,
} = require('../services/sharedDemoProvisioner');
const { parseDeployConfig } = require('../services/packager');

/**
 * Nightly shared-demo reset.
 *
 * Instant demo hands every visitor an ADMIN login on a shared product stack.
 * Without a reset, one person deleting the catalogue leaves every later visitor
 * looking at an empty shop. This job restores each product's demo database from
 * a SQL snapshot and then re-creates the admin rows for demos that are still
 * active, so nobody's login breaks overnight.
 *
 * Snapshots live at  $SHARED_DEMO_SNAPSHOT_DIR/<db_name>.sql  (default ./demo-snapshots).
 * A product without a snapshot file is skipped and logged — never wiped.
 */
const SNAPSHOT_DIR = process.env.SHARED_DEMO_SNAPSHOT_DIR
  || path.join(__dirname, '..', '..', 'demo-snapshots');

function snapshotPathFor(dbName) {
  return path.join(SNAPSHOT_DIR, `${dbName}.sql`);
}

/** Distinct demo databases across active products that support the instant demo. */
async function listDemoDatabases() {
  const { rows } = await pool.query(
    'SELECT id, slug, deploy_config FROM products WHERE is_active = 1 AND is_trialable = 1'
  );
  const map = new Map();
  for (const p of rows) {
    const dc = parseDeployConfig(p.deploy_config);
    if (dc.supports_option1 === false) continue;
    const db = resolveDemoDbName(dc);
    if (!map.has(db)) map.set(db, { db, deployConfig: dc, products: [] });
    map.get(db).products.push(p.slug);
  }
  return [...map.values()];
}

async function restoreSnapshot(dbName, deployConfig) {
  const file = snapshotPathFor(dbName);
  if (!fs.existsSync(file)) {
    return { ok: false, skipped: true, reason: `snapshot missing: ${file}` };
  }
  const sql = fs.readFileSync(file, 'utf8');
  if (!sql.trim()) return { ok: false, skipped: true, reason: 'snapshot empty' };

  const cfg = { ...getDbConfig(deployConfig), database: dbName, multipleStatements: true };
  const conn = await mysql.createConnection(cfg);
  const startedAt = Date.now();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query(sql);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    return { ok: true, ms: Date.now() - startedAt, bytes: Buffer.byteLength(sql) };
  } finally {
    await conn.end();
  }
}

/** Put back ADMIN logins for demos that are still running on this database. */
async function reactivateActiveDemoAdmins(dbName) {
  const { rows } = await pool.query(
    `SELECT ti.id, ti.admin_email, ti.admin_password_enc, ti.meta, tr.customer_name, p.deploy_config
       FROM trial_instances ti
       LEFT JOIN trial_requests tr ON tr.id = ti.request_id
       LEFT JOIN products p ON p.id = ti.product_id
      WHERE ti.trial_type = 'hosted' AND ti.status = 'active'`
  );
  let restored = 0;
  for (const inst of rows) {
    const meta = parseInstanceMeta(inst.meta);
    const instDb = meta.sharedDemoDbName || resolveDemoDbName(parseDeployConfig(inst.deploy_config));
    if (instDb !== dbName || !inst.admin_email || !inst.admin_password_enc) continue;
    const created = await createTrialAdmin({
      email: inst.admin_email,
      password: decrypt(inst.admin_password_enc),
      name: inst.customer_name,
      deployConfig: { ...parseDeployConfig(inst.deploy_config), shared_demo_db_name: dbName },
    });
    if (created.ok) restored += 1;
    else console.error(`[demoReset] re-create admin failed for ${inst.admin_email}: ${created.error}`);
  }
  return restored;
}

/**
 * Run a reset across all demo databases. Returns a per-db report so the admin
 * "Reset now" button can show what happened.
 */
async function runDemoReset({ force = false, only = null } = {}) {
  const settings = await getTrialSettings();
  if (!force && !settings.demoResetEnabled) {
    return { ok: true, skipped: true, reason: 'trial_demo_reset_enabled is off' };
  }

  const targets = (await listDemoDatabases()).filter((t) => !only || t.db === only);
  const report = [];

  for (const target of targets) {
    try {
      const restore = await restoreSnapshot(target.db, target.deployConfig);
      if (!restore.ok) {
        report.push({ db: target.db, products: target.products, ...restore });
        console.log(`[demoReset] ${target.db}: skipped — ${restore.reason}`);
        continue;
      }
      const adminsRestored = await reactivateActiveDemoAdmins(target.db);
      report.push({ db: target.db, products: target.products, ok: true, ms: restore.ms, adminsRestored });
      console.log(`[demoReset] ${target.db}: restored in ${restore.ms}ms, ${adminsRestored} demo admin(s) re-created`);
    } catch (e) {
      report.push({ db: target.db, products: target.products, ok: false, error: e.message });
      console.error(`[demoReset] ${target.db} failed:`, e.message);
    }
  }

  // One audit row per run (no instance context → use a synthetic id).
  await logEvent('00000000-0000-0000-0000-000000000000', 'demo_reset_run', { force, report });
  return { ok: true, report, ranAt: new Date().toISOString() };
}

function startDemoResetCron() {
  const cron = require('node-cron');
  // 03:30 server time — after the 02:30 backup job, before Bangladesh morning traffic.
  cron.schedule(process.env.SHARED_DEMO_RESET_CRON || '30 3 * * *', () => {
    runDemoReset().catch((e) => console.error('[demoReset]', e.message));
  });
  console.log(`[demoReset] Nightly shared-demo reset scheduled (snapshots: ${SNAPSHOT_DIR})`);
}

module.exports = { runDemoReset, startDemoResetCron, snapshotPathFor, SNAPSHOT_DIR };
