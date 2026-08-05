/**
 * Post-restart verification of dashboard scopes + paid lock after freeze.
 * Uses existing rows from test-paid-deploy-local / test-installer-local.
 */
require('dotenv').config();
const http = require('http');
const { execFileSync } = require('child_process');
const path = require('path');
const { pool } = require('../src/config/db');

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
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
        timeout: 15000,
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
          resolve({ status: res.statusCode, json, body: b });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let b = '';
      res.on('data', (d) => (b += d));
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(5000, () => req.destroy());
  });
}

(async () => {
  const login = await request('POST', '/api/auth/login', {}, {
    email: 'admin@trialvo.com',
    password: 'Antor@123',
  });
  if (!login.json?.token) throw new Error('login failed ' + login.body);
  const auth = { Authorization: `Bearer ${login.json.token}` };

  const trials = await request('GET', '/api/admin/trial-instances?scope=trials', auth);
  const deps = await request('GET', '/api/admin/trial-instances?scope=deployments', auth);
  const analytics = await request('GET', '/api/admin/trial-instances/deployment-analytics', auth);

  console.log('trials count', (trials.json || []).length, 'kinds', [...new Set((trials.json || []).map((x) => x.instance_kind || 'trial'))]);
  console.log('deps count', (deps.json || []).length, 'kinds', [...new Set((deps.json || []).map((x) => x.instance_kind))]);
  console.log('analytics', analytics.status, analytics.json);

  const trialLeak = (trials.json || []).some((x) => x.instance_kind === 'paid' || x.instance_kind === 'unlicensed');
  const depLeak = (deps.json || []).some((x) => !x.instance_kind || x.instance_kind === 'trial');
  console.log(trialLeak ? 'FAIL trials leaked paid/unlic' : 'PASS trials scope clean');
  console.log(depLeak ? 'FAIL deps leaked trial' : 'PASS deployments scope clean');
  console.log(analytics.status === 200 ? 'PASS deployment analytics' : 'FAIL analytics');

  // Ensure paid frozen + enqueue freeze + restart api+license-agent
  const { rows: paid } = await pool.query(
    "SELECT id, install_id, status FROM trial_instances WHERE instance_kind='paid' ORDER BY created_at DESC LIMIT 1"
  );
  if (!paid.length) throw new Error('no paid instance');
  console.log('paid', paid[0]);

  if (paid[0].status !== 'frozen') {
    await pool.query("UPDATE trial_instances SET status='frozen', frozen_at=NOW() WHERE id=$1", [paid[0].id]);
  }
  const cmdId = require('crypto').randomUUID();
  await pool.query(
    `INSERT INTO remote_commands (id, instance_id, command, status) VALUES ($1,$2,'freeze','pending')`,
    [cmdId, paid[0].id]
  );

  const dir = path.join(process.env.TEMP, `paid-${paid[0].install_id.slice(0, 8)}`);
  const compose = path.join(dir, 'docker-compose.yml');
  console.log('restarting', compose);
  execFileSync('docker', ['compose', '-f', compose, 'restart', 'api', 'license-agent'], {
    stdio: 'inherit',
    windowsHide: true,
  });

  // Read API port from .env
  const envTxt = require('fs').readFileSync(path.join(dir, '.env'), 'utf8');
  const apiPort = (envTxt.match(/^API_PORT=(\d+)/m) || [])[1];
  let locked = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const r = await get(`http://localhost:${apiPort}/api/v1/user/analytics`);
    console.log('api', r.status, (r.body || '').slice(0, 80));
    if (r.status === 403) {
      locked = true;
      break;
    }
  }
  console.log(locked ? 'PASS paid locked after freeze' : 'FAIL paid still unlocked');

  // Trial stack still listed
  const trialActive = (trials.json || []).filter((x) => x.status === 'active');
  console.log('active trials in scope', trialActive.length);

  const ok = !trialLeak && !depLeak && analytics.status === 200 && locked;
  console.log(ok ? '\n✅ DASHBOARD + LOCK VERIFY PASS' : '\n⚠️ VERIFY INCOMPLETE');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
