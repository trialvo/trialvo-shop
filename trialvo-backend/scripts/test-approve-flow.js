/* Full Option-1 approve flow on local Docker (Phase 1 integration test).
 *
 * Requires the Control Plane (this backend) to be running on :5000 so the
 * provisioned instance's agent can register + fetch a lease. Steps:
 *   1. mark a product trialable + insert a hosted trial_request
 *   2. provisionFromRequest -> real local docker stack (db seed + api)
 *   3. poll the instance API until the licenseGuard UNLOCKS (register+lease loop)
 *   4. destroy the stack
 *
 * Run: DOCKER_PROVISION=1 PROVISION_MODE=local node scripts/test-approve-flow.js
 */
process.env.DOCKER_PROVISION = process.env.DOCKER_PROVISION || '1';
process.env.PROVISION_MODE = process.env.PROVISION_MODE || 'local';

const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const { randomToken } = require('../src/utils/crypto');
const { destroyDockerStack } = require('../src/services/dockerProvisioner');

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1. pick an active product and make it trialable
  const prod = await pool.query("SELECT id, slug FROM products WHERE is_active = 1 ORDER BY created_at LIMIT 1");
  if (prod.rows.length === 0) throw new Error('No active product to trial');
  const product = prod.rows[0];
  await pool.query('UPDATE products SET is_trialable = 1 WHERE id = $1', [product.id]);
  console.log('==> Using product:', product.slug);

  // 2. insert a hosted trial request
  const reqId = uuidv4();
  const publicToken = randomToken(24);
  await pool.query(
    `INSERT INTO trial_requests (id, public_token, product_id, trial_type, customer_name, email, phone, requested_days)
     VALUES ($1,$2,$3,'hosted','Local Test','local-test@trialvo.demo','01700000000',14)`,
    [reqId, publicToken, product.id]
  );
  const requestRow = {
    id: reqId, public_token: publicToken, product_id: product.id, trial_type: 'hosted',
    customer_name: 'Local Test', email: 'local-test@trialvo.demo', phone: '01700000000',
  };

  // 3. provision (email send may fail in dev; we only care about the stack + row)
  console.log('==> Provisioning (local docker)... this builds/starts db+api and seeds ~30MB');
  const t0 = Date.now();
  const { provisionFromRequest } = require('../src/services/provisioner');
  let installId;
  try {
    const r = await provisionFromRequest(requestRow, 14);
    installId = r.installId;
  } catch (e) {
    console.warn('   provisionFromRequest threw (likely email):', e.message);
  }

  // find the instance row (by request) to read docker ports/projectDir
  const inst = await pool.query(
    'SELECT install_id, meta, api_url FROM trial_instances WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1',
    [reqId]
  );
  if (inst.rows.length === 0) throw new Error('No trial_instance row created');
  const meta = typeof inst.rows[0].meta === 'string' ? JSON.parse(inst.rows[0].meta) : inst.rows[0].meta;
  installId = installId || inst.rows[0].install_id;
  const ports = meta?.docker?.ports;
  const projectDir = meta?.docker?.projectDir;
  console.log(`   provisioned in ${Math.round((Date.now() - t0) / 1000)}s; installId=${installId}`);
  console.log('   docker meta:', JSON.stringify(meta?.docker));

  if (!ports?.api) throw new Error('No api port in meta (provision failed?)');
  const apiUrl = `http://localhost:${ports.api}`;

  // 4. poll until the licenseGuard unlocks (agent registers + fetches lease)
  console.log(`\n==> Polling ${apiUrl}/api/products until UNLOCKED (register+lease loop)...`);
  let unlocked = false;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const r = await getJson(`${apiUrl}/api/products`);
    const locked = (r.body || '').includes('TRIAL_LOCKED');
    process.stdout.write(`   status=${r.status ?? r.error} locked=${locked}\n`);
    if (r.status && r.status !== 403 && !locked) { unlocked = true; break; }
    await sleep(5000);
  }

  console.log(unlocked ? '\n✅ TRIAL UNLOCKED — full register→lease→serve loop works!' : '\n⚠️ Still locked after timeout (check CP reachability from container).');

  // 5. destroy (unless KEEP=1, so logs can be inspected on failure)
  if (projectDir && process.env.KEEP !== '1') {
    console.log('\n==> Destroying stack...');
    console.log('destroy:', await destroyDockerStack(projectDir, { hard: true }));
  } else if (projectDir) {
    console.log(`\n==> KEEP=1; leaving stack at ${apiUrl} (project dir: ${projectDir})`);
  }
  await pool.end();
  process.exit(unlocked ? 0 : 2);
})().catch(async (e) => {
  console.error('ERROR:', e.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
