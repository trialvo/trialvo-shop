/* Option-1 shared-demo approve flow.
 *
 * Requires:
 *   - SHARED_DEMO_ENABLED=1 in .env
 *   - Shared demo stack up (deploy/shared-demo) + seeded
 *
 * Steps:
 *   1. insert hosted trial_request
 *   2. provisionFromRequest → ADMIN on shared demo (no per-trial Docker)
 *   3. verify instance meta.sharedDemo + URLs + role_id=2
 *   4. revoke (destroy) → admin deactivated; stack still up
 *   5. sanity: Option 2 packager module still loadable
 *
 * Run: node scripts/test-approve-flow.js
 * KEEP=1 skips revoke step.
 */
require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const { randomToken } = require('../src/utils/crypto');
const {
  ensureConfigured,
  revokeTrialAdmin,
  isSharedDemoInstance,
  getDbConfig,
} = require('../src/services/sharedDemoProvisioner');

function getJson(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(5000, () => req.destroy());
  });
}

(async () => {
  const check = await ensureConfigured();
  if (!check.ok) throw new Error(`Shared demo not ready: ${check.error}`);
  console.log('==> Shared demo OK', check.urls);

  // Option 2 path must still exist (unchanged)
  const packager = require('../src/services/packager');
  if (typeof packager.issueRegistryCredentials !== 'function') {
    throw new Error('Option 2 packager.issueRegistryCredentials missing');
  }
  console.log('==> Option 2 packager module OK');

  const prod = await pool.query("SELECT id, slug FROM products WHERE is_active = 1 ORDER BY created_at LIMIT 1");
  if (prod.rows.length === 0) throw new Error('No active product to trial');
  const product = prod.rows[0];
  await pool.query('UPDATE products SET is_trialable = 1 WHERE id = $1', [product.id]);
  console.log('==> Using product:', product.slug);

  const reqId = uuidv4();
  const publicToken = randomToken(24);
  const email = `shared-test-${Date.now()}@trialvo.demo`;
  await pool.query(
    `INSERT INTO trial_requests (id, public_token, product_id, trial_type, customer_name, email, phone, requested_days)
     VALUES ($1,$2,$3,'hosted','Shared Test',$4,'01700000000',14)`,
    [reqId, publicToken, product.id, email]
  );
  const requestRow = {
    id: reqId, public_token: publicToken, product_id: product.id, trial_type: 'hosted',
    customer_name: 'Shared Test', email, phone: '01700000000',
  };

  console.log('==> Provisioning shared-demo ADMIN grant...');
  const { provisionFromRequest } = require('../src/services/provisioner');
  let result;
  try {
    result = await provisionFromRequest(requestRow, 14);
  } catch (e) {
    console.warn('   provision threw (email may fail):', e.message);
  }

  const inst = await pool.query(
    'SELECT id, install_id, meta, shop_url, admin_url, admin_email, status FROM trial_instances WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1',
    [reqId]
  );
  if (!inst.rows.length) throw new Error('No trial_instance row created');
  const row = inst.rows[0];
  if (!isSharedDemoInstance(row)) throw new Error('Expected meta.sharedDemo=true');
  if (!row.shop_url || !row.admin_url) throw new Error('Missing shared URLs');
  if (!String(row.shop_url).includes(':5100')) throw new Error(`Expected shared shop :5100, got ${row.shop_url}`);
  console.log('   status=', row.status, 'shop=', row.shop_url, 'admin=', row.admin_url);
  console.log('   admin email=', row.admin_email || result?.adminEmail);

  // No per-trial Docker project folder
  const trialsDir = path.resolve(__dirname, '../var/trials');
  if (fs.existsSync(trialsDir)) {
    const dirs = fs.readdirSync(trialsDir).filter((d) => d.includes(row.install_id.slice(0, 8)));
    if (dirs.length) throw new Error(`Unexpected var/trials folder for shared grant: ${dirs.join(',')}`);
  }
  console.log('   no per-trial Docker folder (OK)');

  // Confirm Lifestyle ADMIN role_id=2
  const demoDb = await mysql.createConnection(getDbConfig());
  const [adminRows] = await demoDb.query(
    `SELECT a.id, a.is_active, ar.role_id
     FROM admins a
     LEFT JOIN admin_roles ar ON ar.admin_id = a.id
     WHERE a.email = ?`,
    [(row.admin_email || email).toLowerCase()]
  );
  if (!adminRows.length) throw new Error('Lifestyle admin row missing');
  if (Number(adminRows[0].role_id) !== 2) throw new Error(`Expected role_id=2 ADMIN, got ${adminRows[0].role_id}`);
  if (!adminRows[0].is_active) throw new Error('Admin should be active after provision');
  console.log('   Lifestyle ADMIN role_id=2 is_active=1 (OK)');

  const shopHit = await getJson(row.shop_url);
  console.log('   shop HTTP=', shopHit.status ?? shopHit.error);

  if (process.env.KEEP === '1') {
    console.log('\n==> KEEP=1; leaving grant active');
    await demoDb.end();
    await pool.end();
    process.exit(0);
  }

  console.log('\n==> Revoking shared demo access (no compose down)...');
  const rev = await revokeTrialAdmin({ email: row.admin_email });
  await pool.query("UPDATE trial_instances SET status = 'destroyed', updated_at = NOW() WHERE id = $1", [row.id]);
  console.log('   revoke=', rev);

  const [after] = await demoDb.query(
    'SELECT is_active FROM admins WHERE email = ?',
    [row.admin_email.toLowerCase()]
  );
  if (after[0]?.is_active) throw new Error('Admin still active after revoke');
  console.log('   admin is_active=0 (OK)');

  const shopStillUp = await getJson(row.shop_url);
  console.log('   shop still up HTTP=', shopStillUp.status ?? shopStillUp.error);

  await demoDb.end();
  const ok = rev.ok && shopStillUp.status;
  console.log(ok ? '\n✅ Shared demo Option 1 grant + revoke works' : '\n⚠️ Partial failure');
  await pool.end();
  process.exit(ok ? 0 : 2);
})().catch(async (e) => {
  console.error('ERROR:', e.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
