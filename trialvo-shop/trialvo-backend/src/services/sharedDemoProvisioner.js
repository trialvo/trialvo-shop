/**
 * Option 1 demo access grants (no per-trial Docker).
 * Each product has its own demo API/admin/shop + DB on shared MySQL:
 *   lifestyle_demo | fashion_demo | techshop_demo
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN_ROLE_ID = 2; // roles.name = ADMIN

function sharedDemoEnabled() {
  return process.env.SHARED_DEMO_ENABLED === '1' || process.env.SHARED_DEMO_ENABLED === 'true';
}

function getSharedDemoUrls(deployConfig = {}) {
  const dc = deployConfig && typeof deployConfig === 'object' ? deployConfig : {};
  return {
    shopUrl:
      dc.shared_demo_shop_url ||
      process.env.SHARED_DEMO_SHOP_URL ||
      'http://localhost:5100',
    adminUrl:
      dc.shared_demo_admin_url ||
      process.env.SHARED_DEMO_ADMIN_URL ||
      'http://localhost:5174',
    apiUrl:
      dc.shared_demo_api_url ||
      process.env.SHARED_DEMO_API_URL ||
      'http://localhost:9100',
  };
}

/**
 * Resolve demo MySQL database name from product deploy_config or instance meta.
 */
function resolveDemoDbName(deployConfigOrMeta = {}) {
  const dc = deployConfigOrMeta && typeof deployConfigOrMeta === 'object' ? deployConfigOrMeta : {};
  return (
    dc.shared_demo_db_name ||
    dc.sharedDemoDbName ||
    process.env.SHARED_DEMO_DB_NAME ||
    'lifestyle_demo'
  );
}

function getDbConfig(deployConfig = {}) {
  return {
    host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.SHARED_DEMO_DB_PORT || '3430', 10),
    user: process.env.SHARED_DEMO_DB_USER || 'root',
    password: process.env.SHARED_DEMO_DB_PASSWORD || 'localdev2026',
    database: resolveDemoDbName(deployConfig),
  };
}

/** Prefer instance.meta.sharedDemoDbName when revoking/reactivating. */
function dbConfigFromInstance(inst) {
  const meta = parseInstanceMeta(inst?.meta);
  return getDbConfig({
    shared_demo_db_name: meta.sharedDemoDbName || meta.shared_demo_db_name,
  });
}

async function withDemoDb(fn, deployConfig = {}) {
  const conn = await mysql.createConnection(getDbConfig(deployConfig));
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

async function ensureConfigured(deployConfig = {}) {
  if (!sharedDemoEnabled()) {
    return { ok: false, error: 'SHARED_DEMO_ENABLED is not set' };
  }
  const urls = getSharedDemoUrls(deployConfig);
  if (!urls.shopUrl || !urls.adminUrl || !urls.apiUrl) {
    return { ok: false, error: 'SHARED_DEMO_*_URL env vars incomplete' };
  }
  try {
    await withDemoDb(async (conn) => {
      await conn.query('SELECT 1');
    }, deployConfig);
    return { ok: true, urls, database: resolveDemoDbName(deployConfig) };
  } catch (e) {
    return {
      ok: false,
      error: `Demo DB unreachable (${resolveDemoDbName(deployConfig)}): ${e.message}`,
    };
  }
}

/**
 * Upsert an ADMIN (not SUPER_ADMIN) on the product's demo DB.
 */
async function createTrialAdmin({ email, password, name, deployConfig = {} } = {}) {
  if (!email || !password) {
    return { ok: false, error: 'email and password required' };
  }
  const first = (name || 'Trial').split(/\s+/)[0] || 'Trial';
  const last = (name || 'Admin').split(/\s+/).slice(1).join(' ') || 'Admin';
  const hash = await bcrypt.hash(password, 10);
  const database = resolveDemoDbName(deployConfig);

  try {
    const result = await withDemoDb(async (conn) => {
      await conn.query(
        `INSERT INTO admins (email, password_hash, first_name, last_name, is_active, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           is_active = 1,
           deleted_at = NULL,
           first_name = VALUES(first_name),
           last_name = VALUES(last_name),
           token_version = COALESCE(token_version, 1)`,
        [email.trim().toLowerCase(), hash, first.slice(0, 80), last.slice(0, 80)]
      );

      const [rows] = await conn.query(
        'SELECT id FROM admins WHERE email = ? LIMIT 1',
        [email.trim().toLowerCase()]
      );
      const adminId = rows[0]?.id;
      if (!adminId) throw new Error('admin row missing after upsert');

      await conn.query('DELETE FROM admin_roles WHERE admin_id = ?', [adminId]);
      await conn.query(
        'INSERT INTO admin_roles (admin_id, role_id) VALUES (?, ?)',
        [adminId, ADMIN_ROLE_ID]
      );

      return { adminId };
    }, deployConfig);

    return { ok: true, adminId: result.adminId, roleId: ADMIN_ROLE_ID, database };
  } catch (e) {
    return { ok: false, error: e.message || String(e), database };
  }
}

/**
 * Revoke demo access without shutting down the demo stack.
 * Pass deployConfig, database, or instance (meta.sharedDemoDbName).
 */
async function revokeTrialAdmin({ email, deployConfig, database, instance } = {}) {
  if (!email) return { ok: false, error: 'email required' };
  const dc =
    deployConfig ||
    (database ? { shared_demo_db_name: database } : null) ||
    (instance ? { shared_demo_db_name: dbConfigFromInstance(instance).database } : {});
  try {
    const result = await withDemoDb(async (conn) => {
      const [res] = await conn.query(
        `UPDATE admins
         SET is_active = 0,
             token_version = COALESCE(token_version, 1) + 1
         WHERE email = ?`,
        [email.trim().toLowerCase()]
      );
      return { affected: res.affectedRows || 0 };
    }, dc);
    return { ok: true, ...result, database: resolveDemoDbName(dc) };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

/**
 * Re-enable a previously revoked admin (unfreeze / extend).
 */
async function reactivateTrialAdmin({ email, password, deployConfig, database, instance } = {}) {
  if (!email) return { ok: false, error: 'email required' };
  const dc =
    deployConfig ||
    (database ? { shared_demo_db_name: database } : null) ||
    (instance ? { shared_demo_db_name: dbConfigFromInstance(instance).database } : {});
  try {
    return await withDemoDb(async (conn) => {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        await conn.query(
          `UPDATE admins
           SET is_active = 1, password_hash = ?, deleted_at = NULL,
               token_version = COALESCE(token_version, 1) + 1
           WHERE email = ?`,
          [hash, email.trim().toLowerCase()]
        );
      } else {
        await conn.query(
          `UPDATE admins
           SET is_active = 1, deleted_at = NULL,
               token_version = COALESCE(token_version, 1) + 1
           WHERE email = ?`,
          [email.trim().toLowerCase()]
        );
      }
      const [rows] = await conn.query(
        'SELECT id FROM admins WHERE email = ? LIMIT 1',
        [email.trim().toLowerCase()]
      );
      if (!rows[0]) return { ok: false, error: 'admin not found' };
      await conn.query('DELETE FROM admin_roles WHERE admin_id = ?', [rows[0].id]);
      await conn.query(
        'INSERT INTO admin_roles (admin_id, role_id) VALUES (?, ?)',
        [rows[0].id, ADMIN_ROLE_ID]
      );
      return { ok: true, adminId: rows[0].id, database: resolveDemoDbName(dc) };
    }, dc);
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

function parseInstanceMeta(meta) {
  if (!meta) return {};
  if (typeof meta === 'string') {
    try { return JSON.parse(meta); } catch { return {}; }
  }
  return typeof meta === 'object' ? meta : {};
}

function isSharedDemoInstance(metaOrRow) {
  const meta = metaOrRow?.meta !== undefined
    ? parseInstanceMeta(metaOrRow.meta)
    : parseInstanceMeta(metaOrRow);
  return meta.sharedDemo === true || meta.provisionMode === 'shared';
}

module.exports = {
  sharedDemoEnabled,
  getSharedDemoUrls,
  getDbConfig,
  resolveDemoDbName,
  dbConfigFromInstance,
  ensureConfigured,
  createTrialAdmin,
  revokeTrialAdmin,
  reactivateTrialAdmin,
  parseInstanceMeta,
  isSharedDemoInstance,
  ADMIN_ROLE_ID,
};
