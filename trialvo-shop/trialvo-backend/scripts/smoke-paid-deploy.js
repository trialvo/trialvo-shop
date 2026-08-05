/**
 * Smoke: paid deployment + packs + domain conflict (direct service call).
 *   node scripts/smoke-paid-deploy.js
 */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { runMigrations } = require('../src/migrations/runner');
const {
  issueEntitlementForOrder,
  provisionPaidDeployment,
  handleDomainConflict,
  parseMeta,
} = require('../src/services/licenseEntitlements');
const { buildPaidDockerZip, buildPaidCpanelZip } = require('../src/services/packager');

(async () => {
  console.log('==> migrations');
  await runMigrations();

  const { rows: products } = await pool.query(
    'SELECT id FROM products WHERE is_active = 1 ORDER BY created_at LIMIT 1'
  );
  if (!products.length) throw new Error('No product');

  const fakeOrder = {
    id: `smoke-order-${Date.now()}`,
    order_id: `smoke-order-${Date.now()}`,
    product_id: products[0].id,
    customer_email: 'paid-smoke@trialvo.demo',
    customer_name: 'Paid Smoke',
  };

  const { entitlement, licenseKey, created } = await issueEntitlementForOrder(fakeOrder);
  console.log('entitlement', entitlement.id, 'created=', created);

  const paid = await provisionPaidDeployment({
    entitlement,
    domain: 'client-a.example.com',
    hostMode: 'docker',
  });
  await pool.query(
    `UPDATE trial_instances SET status = 'active', domain = $1, started_at = NOW() WHERE id = $2`,
    ['client-a.example.com', paid.instanceId]
  );
  console.log('paid instance', paid.instanceId);

  const docker = buildPaidDockerZip({
    installId: paid.installId,
    agentSecret: paid.agentSecret,
    bootstrapToken: paid.bootstrapToken,
    domain: 'client-a.example.com',
    backupKey: paid.backupKey,
    adminEmail: paid.adminEmail,
  });
  const cpanel = buildPaidCpanelZip({
    installId: paid.installId,
    agentSecret: paid.agentSecret,
    bootstrapToken: paid.bootstrapToken,
    domain: 'client-a.example.com',
    backupKey: paid.backupKey,
    adminEmail: paid.adminEmail,
  });
  console.log('docker zip', docker.filename, docker.buffer.length);
  console.log('cpanel zip', cpanel.filename, cpanel.buffer.length, cpanel.files);

  const { rows: instRows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [
    paid.instanceId,
  ]);
  const conflict = await handleDomainConflict(instRows[0], 'pirate-copy.example.com');
  console.log('conflict', conflict);

  const { rows: after } = await pool.query(
    'SELECT status, instance_kind, meta FROM trial_instances WHERE id = $1',
    [paid.instanceId]
  );
  const meta = parseMeta(after[0].meta);
  console.log('status=', after[0].status, 'kind=', after[0].instance_kind, 'alert=', meta.alert);

  const { rows: trials } = await pool.query(
    "SELECT COUNT(*) AS c FROM trial_instances WHERE instance_kind = 'trial' OR instance_kind IS NULL"
  );
  const { rows: deps } = await pool.query(
    "SELECT COUNT(*) AS c FROM trial_instances WHERE instance_kind IN ('paid','unlicensed')"
  );
  console.log('scope split trials=', trials[0].c, 'deployments=', deps[0].c);

  const ok =
    conflict.conflict === true &&
    after[0].status === 'frozen' &&
    meta.alert === 'domain_conflict' &&
    after[0].instance_kind === 'paid' &&
    docker.buffer.length > 100 &&
    cpanel.files.some((f) => f.includes('license.env'));

  console.log(ok ? '\n✅ PAID DEPLOY SMOKE PASS' : '\n⚠️ SMOKE INCOMPLETE', {
    licenseKeyIssued: Boolean(licenseKey),
  });
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
