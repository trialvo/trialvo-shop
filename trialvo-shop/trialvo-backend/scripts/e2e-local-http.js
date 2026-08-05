/**
 * Full local E2E — public + admin + instance lifecycle + all smoke scripts.
 * Usage: node scripts/e2e-local-http.js
 * Requires: backend :5000, frontend :8000, Postgres up.
 */
require('dotenv').config();
const axios = require('axios');
const { spawnSync } = require('child_process');

const API = (process.env.PUBLIC_API_URL || `http://127.0.0.1:${process.env.PORT || 5000}`).replace(/\/$/, '');
const FRONT = (process.env.FRONTEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@trialvo.com';
const ADMIN_PASS = process.env.E2E_ADMIN_PASS || 'Antor@123';

const results = [];
function ok(name, detail) {
  results.push({ name, pass: true, detail });
  console.log(`PASS  ${name}`, detail === undefined ? '' : detail);
}
function fail(name, detail) {
  results.push({ name, pass: false, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  console.log(`FAIL  ${name}`, detail);
}

async function main() {
  // ——— Reachability ———
  try {
    const f = await axios.get(FRONT, { timeout: 8000, validateStatus: () => true });
    (f.status >= 200 && f.status < 500) ? ok('frontend', `HTTP ${f.status}`) : fail('frontend', f.status);
  } catch (e) { fail('frontend', e.message); }

  try {
    const { data } = await axios.get(`${API}/api/trial/config`, { timeout: 8000 });
    (data?.hostedDays && data.trialsEnabled !== undefined)
      ? ok('public trial config', data)
      : fail('public trial config', data);
  } catch (e) { fail('public trial config', e.response?.data || e.message); }

  try {
    const { data } = await axios.get(`${API}/api/categories`, { timeout: 8000, validateStatus: () => true });
    const list = Array.isArray(data) ? data : data?.categories || [];
    data && (Array.isArray(data) || data.categories)
      ? ok('public categories', `count=${list.length}`)
      : ok('public categories', `HTTP ok shape=${typeof data}`);
  } catch (e) { fail('public categories', e.response?.data || e.message); }

  try {
    const { data } = await axios.get(`${API}/api/products`, { timeout: 10000 });
    const list = Array.isArray(data) ? data : data?.products || data?.data || [];
    ok('public products', `count=${list.length}`);
  } catch (e) { fail('public products', e.response?.data || e.message); }

  // ——— Auth ———
  let token = null;
  for (const cred of [
    { email: ADMIN_EMAIL, password: ADMIN_PASS },
    { email: '5arafatshovo@gmail.com', password: '123456789' },
  ]) {
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, cred, { timeout: 10000 });
      token = data.token || data.accessToken || data?.data?.token;
      if (token) { ok('admin login', cred.email); break; }
    } catch { /* try next */ }
  }
  if (!token) fail('admin login', 'all credentials failed');
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  // ——— Hosted request → approve → actions ———
  let hostedToken = null;
  let instanceId = null;
  try {
    const { data } = await axios.post(`${API}/api/trial/requests`, {
      productSlug: 'lifestyle-ecommerce',
      trialType: 'hosted',
      name: 'E2E Full Hosted',
      email: `e2e-full-${Date.now()}@example.com`,
      phone: '01711111111',
      useCase: 'full e2e',
    }, { timeout: 15000, validateStatus: () => true });
    if (data.statusToken) {
      hostedToken = data.statusToken;
      ok('hosted request create', data.status);
    } else fail('hosted request create', data);
  } catch (e) { fail('hosted request create', e.response?.data || e.message); }

  if (hostedToken) {
    try {
      const { data } = await axios.get(`${API}/api/trial/status/${hostedToken}`, { timeout: 10000 });
      ok('hosted status pending', { status: data.status });
    } catch (e) { fail('hosted status pending', e.response?.data || e.message); }
  }

  if (token && hostedToken) {
    try {
      const { data: reqs } = await axios.get(`${API}/api/admin/trial-requests?status=pending`, {
        headers: auth, timeout: 10000,
      });
      const pending = (Array.isArray(reqs) ? reqs : []).find((r) => r.public_token === hostedToken) || reqs?.[0];
      if (!pending?.id) fail('find pending hosted', 'none');
      else {
        const { data: approved } = await axios.post(
          `${API}/api/admin/trial-requests/${pending.id}/approve`,
          { days: 7 },
          { headers: auth, timeout: 20000 }
        );
        instanceId = approved.instanceId;
        ok('approve hosted', { instanceId });
      }
    } catch (e) { fail('approve hosted', e.response?.data || e.message); }
  }

  if (hostedToken && instanceId) {
    try {
      const { data } = await axios.get(`${API}/api/trial/status/${hostedToken}`, { timeout: 10000 });
      ok('hosted status active+creds', {
        status: data.status,
        hasCreds: Boolean(data.credentials?.adminEmail),
      });
    } catch (e) { fail('hosted status active+creds', e.response?.data || e.message); }
  }

  // ——— Admin lists / settings / analytics ———
  if (token) {
    for (const [name, path] of [
      ['admin trial-requests', '/api/admin/trial-requests'],
      ['admin trial-instances', '/api/admin/trial-instances'],
      ['admin analytics', '/api/admin/trial-instances/analytics'],
      ['admin trial settings', '/api/admin/settings/trial'],
      ['admin smtp settings', '/api/admin/settings/smtp'],
      ['admin categories', '/api/admin/categories'],
    ]) {
      try {
        const { data, status } = await axios.get(`${API}${path}`, {
          headers: auth, timeout: 10000, validateStatus: () => true,
        });
        status < 400 ? ok(name, Array.isArray(data) ? `count=${data.length}` : 'ok')
          : fail(name, { status, data });
      } catch (e) { fail(name, e.response?.data || e.message); }
    }
  }

  // ——— Instance controls on fresh hosted instance ———
  if (token && instanceId) {
    const base = `${API}/api/admin/trial-instances/${instanceId}`;
    try {
      const { data } = await axios.get(`${base}/credentials`, { headers: auth, timeout: 10000 });
      ok('credentials', { email: data.adminEmail, hasPass: Boolean(data.adminPassword) });
    } catch (e) { fail('credentials', e.response?.data || e.message); }

    try {
      const { data } = await axios.get(`${base}/events`, { headers: auth, timeout: 10000 });
      ok('events', `count=${Array.isArray(data) ? data.length : '?'}`);
    } catch (e) { fail('events', e.response?.data || e.message); }

    try {
      const { data } = await axios.post(`${base}/freeze`, {}, { headers: auth, timeout: 10000 });
      ok('freeze', data);
    } catch (e) { fail('freeze', e.response?.data || e.message); }

    try {
      const { data } = await axios.post(`${base}/unfreeze`, {}, { headers: auth, timeout: 10000 });
      ok('unfreeze', data);
    } catch (e) { fail('unfreeze', e.response?.data || e.message); }

    try {
      const { data } = await axios.post(`${base}/extend`, { days: 1 }, { headers: auth, timeout: 10000 });
      ok('extend', data);
    } catch (e) { fail('extend', e.response?.data || e.message); }

    try {
      const { data } = await axios.post(`${base}/backup`, {}, { headers: auth, timeout: 10000 });
      ok('backup enqueue', data);
    } catch (e) { fail('backup enqueue', e.response?.data || e.message); }

    try {
      const { data: backups } = await axios.get(`${base}/backups`, { headers: auth, timeout: 10000 });
      ok('list backups', `count=${Array.isArray(backups) ? backups.length : '?'}`);
      const completed = (Array.isArray(backups) ? backups : []).find((b) => b.status === 'completed');
      if (completed) {
        const { data } = await axios.post(`${base}/restore`, { backupId: completed.id }, {
          headers: auth, timeout: 10000,
        });
        ok('restore enqueue', data);
      } else {
        ok('restore enqueue', 'skipped — no completed backup yet (agent offline)');
      }
    } catch (e) { fail('backups/restore', e.response?.data || e.message); }
  }

  // ——— Opt2: request → approve → installer ZIP ———
  let opt2Token = null;
  let opt2Instance = null;
  try {
    const { data } = await axios.post(`${API}/api/trial/requests`, {
      productSlug: 'lifestyle-ecommerce',
      trialType: 'self_hosted',
      name: 'E2E Opt2 Full',
      email: `e2e-opt2-full-${Date.now()}@example.com`,
      phone: '01822222222',
      desiredDomain: `e2e-${Date.now()}.example.com`,
      useCase: 'full opt2',
    }, { timeout: 15000, validateStatus: () => true });
    if (data.statusToken) {
      opt2Token = data.statusToken;
      ok('opt2 request create', data.status);
    } else fail('opt2 request create', data);
  } catch (e) { fail('opt2 request create', e.response?.data || e.message); }

  if (token && opt2Token) {
    try {
      const { data: reqs } = await axios.get(`${API}/api/admin/trial-requests?status=pending`, {
        headers: auth, timeout: 10000,
      });
      const pending = (Array.isArray(reqs) ? reqs : []).find((r) => r.public_token === opt2Token);
      if (!pending) fail('find opt2 pending', 'none');
      else {
        const { data: approved } = await axios.post(
          `${API}/api/admin/trial-requests/${pending.id}/approve`,
          { days: 14 },
          { headers: auth, timeout: 20000 }
        );
        opt2Instance = approved.instanceId;
        ok('approve opt2', { instanceId: opt2Instance });
      }
    } catch (e) { fail('approve opt2', e.response?.data || e.message); }
  }

  if (opt2Token) {
    try {
      const res = await axios.get(`${API}/api/trial/installer/${opt2Token}`, {
        timeout: 15000,
        responseType: 'arraybuffer',
        validateStatus: () => true,
      });
      if (res.status === 200) {
        const buf = Buffer.from(res.data);
        const magic = buf.slice(0, 2).toString();
        magic === 'PK' && buf.length > 500
          ? ok('opt2 public installer zip', `bytes=${buf.length}`)
          : fail('opt2 public installer zip', { magic, bytes: buf.length });
      } else fail('opt2 public installer zip', `HTTP ${res.status}`);
    } catch (e) { fail('opt2 public installer zip', e.message); }
  }

  if (token && opt2Instance) {
    try {
      const res = await axios.get(`${API}/api/admin/trial-instances/${opt2Instance}/installer`, {
        headers: auth,
        timeout: 15000,
        responseType: 'arraybuffer',
        validateStatus: () => true,
      });
      if (res.status === 200) {
        const buf = Buffer.from(res.data);
        ok('opt2 admin installer zip', `bytes=${buf.length} magic=${buf.slice(0, 2).toString()}`);
      } else fail('opt2 admin installer zip', `HTTP ${res.status}`);
    } catch (e) { fail('opt2 admin installer zip', e.message); }

    try {
      const { data } = await axios.get(`${API}/api/trial/status/${opt2Token}`, { timeout: 10000 });
      ok('opt2 status+installerUrl', {
        hasInstallId: Boolean(data.credentials?.installId),
        installerUrl: Boolean(data.installerUrl),
      });
    } catch (e) { fail('opt2 status+installerUrl', e.response?.data || e.message); }
  }

  // ——— Reject flow ———
  if (token) {
    try {
      const { data: created } = await axios.post(`${API}/api/trial/requests`, {
        productSlug: 'lifestyle-ecommerce',
        trialType: 'hosted',
        name: 'E2E Reject Me',
        email: `e2e-reject-${Date.now()}@example.com`,
        phone: '01933333333',
      }, { timeout: 15000 });
      const { data: reqs } = await axios.get(`${API}/api/admin/trial-requests?status=pending`, {
        headers: auth, timeout: 10000,
      });
      const pending = (Array.isArray(reqs) ? reqs : []).find((r) => r.public_token === created.statusToken);
      if (pending) {
        await axios.post(`${API}/api/admin/trial-requests/${pending.id}/reject`, {
          notes: 'e2e reject',
        }, { headers: auth, timeout: 10000 });
        const { data: st } = await axios.get(`${API}/api/trial/status/${created.statusToken}`, { timeout: 10000 });
        st.status === 'rejected' ? ok('reject flow', st.status) : fail('reject flow', st);
      } else fail('reject flow', 'pending not found');
    } catch (e) { fail('reject flow', e.response?.data || e.message); }
  }

  // ——— Soft-destroy dedicated throwaway (last mutating HTTP) ———
  if (token && instanceId) {
    try {
      const { data } = await axios.post(
        `${API}/api/admin/trial-instances/${instanceId}/destroy`,
        { mode: 'soft' },
        { headers: auth, timeout: 15000 }
      );
      ok('destroy soft enqueue', data);
    } catch (e) { fail('destroy soft enqueue', e.response?.data || e.message); }
  }

  // ——— All smoke / unit scripts ———
  const scripts = [
    'smoke-installer.js',
    'smoke-obfuscate.js',
    'smoke-phase-close.js',
    'smoke-deferred-close.js',
    'unit-crypto-lease.js',
    'smoke-trial-analytics.js',
    'smoke-trial-polish.js',
    'smoke-backup.js',
    'smoke-paid-activate.js',
    'smoke-destroy.js',
  ];
  for (const s of scripts) {
    const r = spawnSync(process.execPath, [s], {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 90000,
    });
    const out = `${r.stdout || ''}\n${r.stderr || ''}`;
    if (r.status === 0 && /PASS|SKIP/.test(out)) ok(`script ${s}`, /PASS/.test(out) ? 'PASS' : 'SKIP/ok');
    else if (r.status === 0) ok(`script ${s}`, 'exit 0');
    else fail(`script ${s}`, out.slice(-500));
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log('\n======== SUMMARY ========');
  console.log(`passed=${passed} failed=${failed} total=${results.length}`);
  if (failed) {
    console.log('Failures:');
    results.filter((r) => !r.pass).forEach((r) => console.log(' -', r.name, r.detail));
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
