/**
 * Paid + unlicensed deployment E2E on local Docker Desktop.
 * Creates a paid instance, boots Opt2-style compose with LICENSE_ENFORCE=1,
 * verifies Deployments scope, then simulates unlicensed row + domain conflict.
 *
 * Prereqs: CP :5000, registry :5300 (or TRIAL_REGISTRY), trial images pushed.
 *   node scripts/test-paid-deploy-local.js
 *   KEEP=1 to leave paid stack up
 */
require('dotenv').config();
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const { randomHex, encrypt } = require('../src/utils/crypto');
const {
  issueEntitlementForOrder,
  provisionPaidDeployment,
  handleDomainConflict,
  parseMeta,
} = require('../src/services/licenseEntitlements');
const { buildAgentEnv, loadLicensePublicKey } = require('../src/services/packager');

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const REGISTRY = process.env.TRIAL_REGISTRY || 'localhost:5300';
const CP_URL = 'http://host.docker.internal:5000';
const KEEP = process.env.KEEP === '1';

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
    s.on('error', reject);
  });
}

function getJson(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let b = '';
      res.on('data', (d) => {
        b += d;
      });
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(5000, () => req.destroy());
  });
}

function request(method, urlPath, headers = {}, body) {
  return new Promise((resolve, reject) => {
    const payload = body != null ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: urlPath,
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let b = '';
        res.on('data', (d) => (b += d));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(b || 'null');
          } catch {
            /* ignore */
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const results = [];
  const pass = (name, ok, detail) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
    results.push({ name, ok, detail });
  };

  const { rows: products } = await pool.query(
    'SELECT id FROM products WHERE is_active = 1 ORDER BY created_at LIMIT 1'
  );
  if (!products.length) throw new Error('No product');

  const domain = 'paid-local.example.com';
  const order = {
    id: `paid-local-${Date.now()}`,
    order_id: `paid-local-${Date.now()}`,
    product_id: products[0].id,
    customer_email: 'paid-local@trialvo.demo',
    customer_name: 'Paid Local',
  };

  console.log('==> Issue entitlement + paid deployment');
  const { entitlement, licenseKey } = await issueEntitlementForOrder(order);
  const paid = await provisionPaidDeployment({
    entitlement,
    domain,
    hostMode: 'docker',
    adminEmail: 'paid-local@trialvo.demo',
  });
  pass('paid provision', true, paid.instanceId);

  const apiPort = await freePort();
  const adminPort = await freePort();
  const shopPort = await freePort();
  const dbPw = `Root_${randomHex(6)}`;
  const dir = path.join(os.tmpdir(), `paid-${paid.installId.slice(0, 8)}`);
  fs.mkdirSync(dir, { recursive: true });

  const agentEnv = buildAgentEnv({
    installId: paid.installId,
    agentSecret: paid.agentSecret,
    bootstrapToken: paid.bootstrapToken,
    domain,
    backupKey: paid.backupKey,
    adminEmail: paid.adminEmail,
    adminPassword: `Paid_${randomHex(4)}`,
    registryCreds: {
      registry: REGISTRY,
      user: `paid-${paid.installId.slice(0, 8)}`,
      token: 'local',
    },
    controlPlaneUrl: CP_URL,
    mode: 'paid',
    nodeOnly: false,
  });
  fs.writeFileSync(path.join(dir, 'agent.env'), agentEnv);
  if (!agentEnv.includes('LICENSE_ENFORCE=1')) throw new Error('agent.env missing LICENSE_ENFORCE');

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

  console.log(`==> docker compose up paid stack (${dir})`);
  console.log(`   ports api=${apiPort} admin=${adminPort} shop=${shopPort}`);
  await execFileAsync('docker', ['compose', '-f', path.join(dir, 'docker-compose.yml'), 'up', '-d'], {
    cwd: dir,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });

  console.log('==> Poll paid API unlock');
  let apiOk = false;
  let lastStatus = '';
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    const r = await getJson(`http://localhost:${apiPort}/api/v1/user/analytics`);
    lastStatus = String(r.status || r.error);
    if (r.status === 200) {
      apiOk = true;
      break;
    }
    if (i % 3 === 0) console.log('   wait…', lastStatus);
  }
  pass('paid API unlocked', apiOk, `status=${lastStatus}`);

  const { rows: paidRow } = await pool.query(
    'SELECT status, instance_kind, domain, last_heartbeat_at FROM trial_instances WHERE id = $1',
    [paid.instanceId]
  );
  pass(
    'CP paid instance active',
    paidRow[0]?.status === 'active' && paidRow[0]?.instance_kind === 'paid',
    JSON.stringify(paidRow[0])
  );

  // Admin scope split
  const login = await request('POST', '/api/auth/login', {}, {
    email: process.env.ADMIN_EMAIL || 'admin@trialvo.com',
    password: process.env.ADMIN_PASSWORD || 'Antor@123',
  });
  const token = login.json?.token;
  pass('admin login', Boolean(token));
  const auth = { Authorization: `Bearer ${token}` };

  const trials = await request('GET', '/api/admin/trial-instances?scope=trials', auth);
  const deps = await request('GET', '/api/admin/trial-instances?scope=deployments', auth);
  const trialHasPaid = (trials.json || []).some((x) => x.id === paid.instanceId);
  const depHasPaid = (deps.json || []).some((x) => x.id === paid.instanceId);
  const depOnlyPaidOrUnlic = (deps.json || []).every(
    (x) => x.instance_kind === 'paid' || x.instance_kind === 'unlicensed'
  );
  pass('trials scope excludes paid', !trialHasPaid, `trials=${(trials.json || []).length}`);
  pass('deployments scope includes paid', depHasPaid && depOnlyPaidOrUnlic, `deps=${(deps.json || []).length}`);

  const analytics = await request('GET', '/api/admin/trial-instances/deployment-analytics', auth);
  pass(
    'deployment analytics',
    analytics.status === 200 && Number(analytics.json?.paidActive || 0) >= 1,
    JSON.stringify(analytics.json)
  );

  // Unlicensed row (simulates detected bad install seat)
  const unlicId = uuidv4();
  const unlicInstall = randomHex(16);
  await pool.query(
    `INSERT INTO trial_instances
      (id, install_id, product_id, trial_type, instance_kind, status, domain, admin_email, meta)
     VALUES ($1,$2,$3,'self_hosted','unlicensed','frozen','stolen.example.com','stolen@evil.test',$4)`,
    [
      unlicId,
      unlicInstall,
      products[0].id,
      JSON.stringify({ alert: 'unlicensed', note: 'smoke unlicensed row' }),
    ]
  );
  const deps2 = await request('GET', '/api/admin/trial-instances?scope=deployments', auth);
  const hasUnlic = (deps2.json || []).some((x) => x.id === unlicId);
  pass('unlicensed visible in deployments', hasUnlic);

  // Domain conflict on paid
  const { rows: fullPaid } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [
    paid.instanceId,
  ]);
  const conflict = await handleDomainConflict(fullPaid[0], 'pirate-resell.example.com');
  const { rows: afterConflict } = await pool.query(
    'SELECT status, meta FROM trial_instances WHERE id = $1',
    [paid.instanceId]
  );
  const meta = parseMeta(afterConflict[0].meta);
  pass(
    'domain conflict freezes paid',
    conflict.conflict && afterConflict[0].status === 'frozen' && meta.alert === 'domain_conflict'
  );

  // Clear stale Go-gate JWT + force Node startup sync against frozen CP status.
  // (Lease tick alone can take ~15–30m; restart makes conflict lock testable quickly.)
  await execFileAsync(
    'docker',
    ['compose', '-f', path.join(dir, 'docker-compose.yml'), 'restart', 'license-agent', 'api'],
    { cwd: dir, windowsHide: true }
  );
  let locked = false;
  let lastLockStatus = '';
  for (let i = 0; i < 36; i++) {
    await sleep(5000);
    const r = await getJson(`http://localhost:${apiPort}/api/v1/user/analytics`);
    lastLockStatus = String(r.status || r.error || '');
    if (r.status === 403 || /LICENSE_LOCKED|TRIAL_LOCKED/.test(r.body || '')) {
      locked = true;
      break;
    }
    if (i % 3 === 0) console.log('   wait lock…', lastLockStatus);
  }
  pass('paid API locks after conflict', locked, `status=${lastLockStatus}`);

  console.log('\n== SUMMARY ==');
  for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}`);
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nPaid stack: http://localhost:${apiPort}  dir=${dir}` +
      `\nlicenseKey (once): ${licenseKey || '(reused)'}` +
      `\nunlicensed id: ${unlicId}`
  );

  if (!KEEP) {
    console.log('KEEP!=1 → tearing down paid stack');
    await execFileAsync('docker', ['compose', '-f', path.join(dir, 'docker-compose.yml'), 'down', '-v'], {
      cwd: dir,
      windowsHide: true,
    });
  } else {
    console.log('KEEP=1 → paid stack left up');
  }

  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
