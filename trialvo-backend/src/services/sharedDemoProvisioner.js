/**
 * Shared Lifestyle demo — Option 1 access grants (no per-trial Docker).
 * Creates/revokes Lifestyle ADMIN users (role_id=2) on the shared demo MySQL.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN_ROLE_ID = 2; // Lifestyle roles.name = ADMIN

function sharedDemoEnabled() {
  return process.env.SHARED_DEMO_ENABLED === '1' || process.env.SHARED_DEMO_ENABLED === 'true';
}

function getSharedDemoUrls() {
  return {
    shopUrl: process.env.SHARED_DEMO_SHOP_URL || 'http://localhost:5100',
    adminUrl: process.env.SHARED_DEMO_ADMIN_URL || 'http://localhost:5174',
    apiUrl: process.env.SHARED_DEMO_API_URL || 'http://localhost:9100',
  };
}

function getDbConfig() {
  return {
    host: process.env.SHARED_DEMO_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.SHARED_DEMO_DB_PORT || '23307', 10),
    user: process.env.SHARED_DEMO_DB_USER || 'root',
    password: process.env.SHARED_DEMO_DB_PASSWORD || 'sharedDemoRoot2026',
    database: process.env.SHARED_DEMO_DB_NAME || 'ecom',
  };
}

async function withDemoDb(fn) {
  const conn = await mysql.createConnection(getDbConfig());
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

async function ensureConfigured() {
  if (!sharedDemoEnabled()) {
    return { ok: false, error: 'SHARED_DEMO_ENABLED is not set' };
  }
  const urls = getSharedDemoUrls();
  if (!urls.shopUrl || !urls.adminUrl || !urls.apiUrl) {
    return { ok: false, error: 'SHARED_DEMO_*_URL env vars incomplete' };
  }
  try {
    await withDemoDb(async (conn) => {
      await conn.query('SELECT 1');
    });
    return { ok: true, urls };
  } catch (e) {
    return { ok: false, error: `Shared demo DB unreachable: ${e.message}` };
  }
}

/**
 * Upsert an ADMIN (not SUPER_ADMIN) on the shared Lifestyle demo.
 */
async function createTrialAdmin({ email, password, name } = {}) {
  if (!email || !password) {
    return { ok: false, error: 'email and password required' };
  }
  const first = (name || 'Trial').split(/\s+/)[0] || 'Trial';
  const last = (name || 'Admin').split(/\s+/).slice(1).join(' ') || 'Admin';
  const hash = await bcrypt.hash(password, 10);

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

      // Ensure ADMIN role (2); remove accidental SUPER_ADMIN if re-provisioning
      await conn.query('DELETE FROM admin_roles WHERE admin_id = ?', [adminId]);
      await conn.query(
        'INSERT INTO admin_roles (admin_id, role_id) VALUES (?, ?)',
        [adminId, ADMIN_ROLE_ID]
      );

      return { adminId };
    });

    return { ok: true, adminId: result.adminId, roleId: ADMIN_ROLE_ID };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

/**
 * Revoke demo access without shutting down the shared stack.
 */
async function revokeTrialAdmin({ email } = {}) {
  if (!email) return { ok: false, error: 'email required' };
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
    });
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

/**
 * Re-enable a previously revoked admin (unfreeze / extend).
 */
async function reactivateTrialAdmin({ email, password } = {}) {
  if (!email) return { ok: false, error: 'email required' };
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
      return { ok: true, adminId: rows[0].id };
    });
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
  ensureConfigured,
  createTrialAdmin,
  revokeTrialAdmin,
  reactivateTrialAdmin,
  parseInstanceMeta,
  isSharedDemoInstance,
  ADMIN_ROLE_ID,
};
