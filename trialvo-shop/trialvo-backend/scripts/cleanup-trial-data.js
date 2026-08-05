/**
 * Wipe Control Plane trial data + shared-demo trial ADMINs (keep SUPER_ADMIN).
 * Does NOT tear down shared-demo Docker stack.
 *
 *   node scripts/cleanup-trial-data.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { pool } = require('../src/config/db');
const { getDbConfig, sharedDemoEnabled } = require('../src/services/sharedDemoProvisioner');

(async () => {
  console.log('==> Clearing Control Plane trial tables...');

  // Break FK from orders first
  try {
    await pool.query('UPDATE orders SET trial_instance_id = NULL WHERE trial_instance_id IS NOT NULL');
  } catch (e) {
    console.log('   (orders.trial_instance_id skip)', e.message);
  }

  // Child → parent order
  const tables = [
    'instance_backups',
    'instance_events',
    'remote_commands',
    'trial_instances',
    'trial_requests',
  ];
  for (const t of tables) {
    try {
      const r = await pool.query(`DELETE FROM ${t}`);
      // mysql2 shim: rowCount / affectedRows
      const n = r.rowCount ?? r.affectedRows ?? (Array.isArray(r) ? r[0]?.affectedRows : '?');
      console.log(`   deleted ${t}: ${n}`);
    } catch (e) {
      console.log(`   skip ${t}:`, e.message);
    }
  }

  // Ensure products ready for trial UI
  await pool.query('UPDATE products SET is_trialable = 1 WHERE is_active = 1');
  console.log('==> All active products marked trialable');

  // Re-run lifestyle product seed (demo URLs)
  try {
    const seed = require('../src/seeds/lifestyleProductSeed');
    await seed.run(pool);
    console.log('==> lifestyle product demo URLs refreshed');
  } catch (e) {
    console.warn('   lifestyle seed:', e.message);
  }

  // Shared demo: remove only automated test ADMINs (keep real ops accounts)
  if (sharedDemoEnabled()) {
    console.log('==> Cleaning shared-demo test ADMIN accounts (@trialvo.demo)...');
    try {
      const cfg = getDbConfig();
      const conn = await mysql.createConnection(cfg);
      const [before] = await conn.query(
        `SELECT COUNT(*) AS c FROM admins
         WHERE email LIKE '%@trialvo.demo'
            OR email LIKE 'shared-test-%'
            OR email LIKE 'login-test-%'
            OR email LIKE 'multi-%'`
      );
      await conn.query(`
        DELETE FROM admin_roles WHERE admin_id IN (
          SELECT id FROM (
            SELECT id FROM admins
            WHERE email LIKE '%@trialvo.demo'
               OR email LIKE 'shared-test-%'
               OR email LIKE 'login-test-%'
               OR email LIKE 'multi-%'
          ) t
        )
      `);
      const [del] = await conn.query(`
        DELETE FROM admins
        WHERE email LIKE '%@trialvo.demo'
           OR email LIKE 'shared-test-%'
           OR email LIKE 'login-test-%'
           OR email LIKE 'multi-%'
      `);
      console.log(`   removed test admins: ${del.affectedRows} (matched ${before[0].c})`);
      await conn.end();
    } catch (e) {
      console.warn('   shared demo cleanup:', e.message);
    }
  }

  const left = await pool.query('SELECT COUNT(*) AS c FROM trial_requests');
  console.log(`\n✅ Trial data cleaned. Remaining requests: ${left.rows[0].c}`);
  await pool.end();
})().catch(async (e) => {
  console.error('ERROR:', e.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
