/* Phase 3 — Option 2 (client-hosted) installer, end to end on local Docker.
 *
 * Simulates a customer running the downloaded installer on their own host:
 *   provision a self_hosted trial -> generate the real installer artifacts
 *   (agent.env / .env / compose / license_public.pem) -> `docker compose up`
 *   pulling images from a LOCAL private registry -> the stack self-seeds, the
 *   Go license-agent + Node client register, the lease gate unlocks the API.
 *
 * Prereqs: Control Plane on :5000, Docker Desktop, and a local registry at
 * localhost:5055 holding lifestyle-{api,admin,shop,license-agent}:trial.
 *
 * Run: node scripts/test-installer-local.js   (KEEP=1 to leave the stack up)
 */
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');

const REGISTRY = 'localhost:5055';
const CP_URL = 'http://host.docker.internal:5000';

const { pool } = require('../src/config/db');
const { decrypt, randomToken, randomHex } = require('../src/utils/crypto');
const { provisionFromRequest } = require('../src/services/provisioner');
const { buildAgentEnv, loadLicensePublicKey } = require('../src/services/packager');

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, () => { const p = s.address().port; s.close(() => resolve(p)); });
    s.on('error', reject);
  });
}

function getJson(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let b = ''; res.on('data', (d) => { b += d; }); res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(5000, () => req.destroy());
  });
}

(async () => {
  const domain = 'opt2-test.local';
  const prod = await pool.query("SELECT id, slug FROM products WHERE is_active = 1 ORDER BY created_at LIMIT 1");
  await pool.query('UPDATE products SET is_trialable = 1 WHERE id = $1', [prod.rows[0].id]);

  const reqId = uuidv4();
  const publicToken = randomToken(24);
  await pool.query(
    `INSERT INTO trial_requests (id, public_token, product_id, trial_type, customer_name, email, phone, requested_days, desired_domain)
     VALUES ($1,$2,$3,'self_hosted','Opt2 Test','opt2-test@trialvo.demo','01700000000',14,$4)`,
    [reqId, publicToken, prod.rows[0].id, domain]
  );
  const requestRow = {
    id: reqId, public_token: publicToken, product_id: prod.rows[0].id, trial_type: 'self_hosted',
    customer_name: 'Opt2 Test', email: 'opt2-test@trialvo.demo', phone: '01700000000', desired_domain: domain,
  };

  console.log('==> Provisioning self_hosted trial (Option 2)...');
  await provisionFromRequest(requestRow, 14);

  const inst = await pool.query(
    'SELECT id, install_id, agent_secret_enc, bootstrap_token_enc, backup_key_enc, admin_email, admin_password_enc, meta FROM trial_instances WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1',
    [reqId]
  );
  const row = inst.rows[0];
  const installId = row.install_id;
  const agentSecret = decrypt(row.agent_secret_enc);
  const bootstrapToken = decrypt(row.bootstrap_token_enc);
  const backupKey = decrypt(row.backup_key_enc);
  const adminEmail = row.admin_email;
  const adminPassword = decrypt(row.admin_password_enc);
  console.log(`   installId=${installId} status(provisioning) domain=${domain}`);
  console.log(`   admin login: ${adminEmail} / ${adminPassword}`);

  // ── assemble the installer bundle exactly as a client would receive it ─────
  const apiPort = await freePort();
  const adminPort = await freePort();
  const shopPort = await freePort();
  const dbPw = `Root_${randomHex(6)}`;

  const dir = path.join(os.tmpdir(), `opt2-${installId.slice(0, 8)}`);
  fs.mkdirSync(dir, { recursive: true });

  const agentEnv = buildAgentEnv({
    installId, agentSecret, bootstrapToken, domain, backupKey,
    adminEmail, adminPassword,
    registryCreds: { registry: REGISTRY, user: `trial-${installId.slice(0, 8)}`, token: 'local' },
    controlPlaneUrl: CP_URL,
  });
  fs.writeFileSync(path.join(dir, 'agent.env'), agentEnv);

  const dotenv = [
    `DOMAIN=${domain}`,
    `DB_ROOT_PASSWORD=${dbPw}`,
    `DB_NAME=ecom`,
    `API_PORT=${apiPort}`,
    `ADMIN_PORT=${adminPort}`,
    `SHOP_PORT=${shopPort}`,
    `PUBLIC_API_ORIGIN=http://localhost:${apiPort}`,
    `PUBLIC_SHOP_ORIGIN=http://localhost:${shopPort}`,
    `JWTSECRET=${randomHex(16)}`,
    `TRIAL_IMAGE_API=${REGISTRY}/lifestyle-api:trial`,
    `TRIAL_IMAGE_ADMIN=${REGISTRY}/lifestyle-admin:trial`,
    `TRIAL_IMAGE_SHOP=${REGISTRY}/lifestyle-shop:trial`,
    `TRIAL_IMAGE_AGENT=${REGISTRY}/lifestyle-license-agent:trial`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, '.env'), dotenv);

  const templateDir = path.resolve(__dirname, '../../deploy/installer-template');
  fs.copyFileSync(path.join(templateDir, 'docker-compose.yml'), path.join(dir, 'docker-compose.yml'));
  fs.writeFileSync(path.join(dir, 'license_public.pem'), loadLicensePublicKey());

  console.log(`   installer dir: ${dir}`);
  console.log(`   ports api=${apiPort} admin=${adminPort} shop=${shopPort}`);

  const compose = (args, timeout = 180000) =>
    execFileAsync('docker', ['compose', '-f', path.join(dir, 'docker-compose.yml'), ...args],
      { cwd: dir, timeout, windowsHide: true, maxBuffer: 16 * 1024 * 1024 });

  let ok = false;
  try {
    console.log('\n==> docker compose up (pull from local registry, self-seed, register)...');
    await compose(['up', '-d'], 300000);

    console.log('==> Polling API for license unlock (seed -> register -> lease -> gate)...');
    const deadline = Date.now() + 300000;
    let last = '';
    while (Date.now() < deadline) {
      const r = await getJson(`http://localhost:${apiPort}/api/v1/user/analytics`);
      last = r.status || r.error;
      if (r.status === 200) { ok = true; break; }
      await sleep(5000);
    }
    console.log(`   final API status: ${last}`);

    // Confirm the independent Go lease-gate actually holds an active lease.
    const gateJs = "require('http').get('http://license-agent:9099/gate',r=>{let b='';r.on('data',d=>b+=d);r.on('end',()=>process.stdout.write(b))}).on('error',e=>process.stdout.write('ERR '+e.message))";
    const gate = await compose(['exec', '-T', 'api', 'node', '-e', gateJs])
      .then((r) => r.stdout.trim()).catch((e) => e.message);
    console.log('   Go agent gate:', gate.slice(0, 160));

    const status = await pool.query('SELECT status FROM trial_instances WHERE id = $1', [row.id]);
    console.log('   instance status on CP:', status.rows[0]?.status);

    ok = ok && status.rows[0]?.status === 'active';
    console.log(ok
      ? '\n✅ OPTION 2 INSTALLER VERIFIED — local registry pull + self-seed + Go-gate unlock'
      : '\n⚠️ Option 2 stack did not fully unlock');
  } catch (e) {
    console.error('ERROR during compose/verify:', e.message);
  } finally {
    if (process.env.KEEP === '1') {
      console.log(`\n==> KEEP=1; stack left at http://localhost:${apiPort} (dir ${dir})`);
    } else {
      console.log('\n==> Tearing down...');
      await compose(['down', '-v', '--remove-orphans'], 120000).catch(() => {});
    }
  }

  await pool.end();
  process.exit(ok ? 0 : 2);
})().catch(async (e) => { console.error('FATAL', e.message); try { await pool.end(); } catch {} process.exit(1); });
