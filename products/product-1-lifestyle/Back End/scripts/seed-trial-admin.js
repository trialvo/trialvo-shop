#!/usr/bin/env node
/**
 * Upsert a Lifestyle admin for trials.
 *
 * Env:
 *   TRIAL_ADMIN_EMAIL, TRIAL_ADMIN_PASSWORD (required)
 *   ROLE_ID — default 1 (SUPER_ADMIN). Shared demo uses 2 (ADMIN).
 *   DB_HOST, DB_ROOT_PASSWORD, DB_NAME
 */
const bcrypt = require('bcrypt');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function main() {
  const email = process.env.TRIAL_ADMIN_EMAIL;
  const password = process.env.TRIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('[seed-admin] TRIAL_ADMIN_EMAIL/PASSWORD not set — skipping');
    return;
  }

  const roleId = parseInt(process.env.ROLE_ID || '1', 10) || 1;
  const roleLabel = roleId === 2 ? 'ADMIN' : (roleId === 1 ? 'SUPER_ADMIN' : `role_id=${roleId}`);
  const host = process.env.DB_HOST || 'db';
  const rootPw = process.env.DB_ROOT_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'ecom';
  const hash = await bcrypt.hash(password, 12);

  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''");
  const sql = [
    `INSERT INTO admins (email, password_hash, first_name, last_name, is_active, created_at)`,
    `VALUES ('${esc(email)}', '${esc(hash)}', 'Trial', 'Admin', 1, NOW())`,
    `ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), is_active=1, deleted_at=NULL, first_name='Trial', last_name='Admin';`,
    `SET @trial_admin_id = (SELECT id FROM admins WHERE email='${esc(email)}' LIMIT 1);`,
    `DELETE FROM admin_roles WHERE admin_id = @trial_admin_id;`,
    `INSERT INTO admin_roles (admin_id, role_id) VALUES (@trial_admin_id, ${roleId});`,
    '',
  ].join('\n');

  const tmp = path.join(os.tmpdir(), `trial-admin-${Date.now()}.sql`);
  fs.writeFileSync(tmp, sql);
  try {
    const r = spawnSync(
      'mysql',
      ['-h', host, '-uroot', `-p${rootPw}`, dbName],
      { input: sql, encoding: 'utf8' }
    );
    if (r.status !== 0) {
      console.error('[seed-admin] mysql failed:', (r.stderr || r.stdout || '').slice(0, 400));
      process.exit(1);
    }
    console.log(`[seed-admin] upserted ${roleLabel} ${email}`);
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

main().catch((e) => {
  console.error('[seed-admin]', e.message || e);
  process.exit(1);
});
