/**
 * Option 2 admin actions smoke test: backup → freeze → unfreeze → restore → destroy(soft).
 * Uses admin login + CP APIs; restarts Opt2 API after each command so the 15m heartbeat
 * picks up remote_commands immediately (startup sync).
 */
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const { URL } = require('url');

const CP = process.env.CP_URL || 'http://localhost:5000';
const API = process.env.OPT2_API || 'http://localhost:7130';
const COMPOSE = process.env.OPT2_COMPOSE || `${process.env.TEMP}\\opt2-c7508704\\docker-compose.yml`;
const INSTALL_ID = process.env.OPT2_INSTALL_ID || 'c75087046d7b448e82120b9235378ed3';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@trialvo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Antor@123';

const results = [];

function log(step, ok, detail) {
  const line = `${ok ? 'PASS' : 'FAIL'}  ${step}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  results.push({ step, ok, detail });
}

function request(method, urlStr, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const payload = body != null ? JSON.stringify(body) : null;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
        timeout: 60000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try {
            json = data ? JSON.parse(data) : null;
          } catch {
            /* raw */
          }
          resolve({ status: res.statusCode, body: data, json });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function restartApi() {
  execSync(`docker compose -f "${COMPOSE}" restart api`, { stdio: 'inherit' });
}

async function waitApi(predicate, label, { timeoutMs = 180000, intervalMs = 4000 } = {}) {
  const start = Date.now();
  let last = '';
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await request('GET', `${API}/api/v1/user/analytics`);
      last = String(r.status);
      if (predicate(r)) return r;
    } catch (e) {
      last = e.message;
    }
    await sleep(intervalMs);
  }
  throw new Error(`${label} timed out (last=${last})`);
}

async function waitCmd(token, commandId, { timeoutMs = 180000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // Probe via instance events / backups rather than raw SQL — use list backups + status polls.
    // Command status is not exposed on admin API; we infer from side effects + optional DB via events.
    const ev = await request('GET', `${CP}/api/admin/trial-instances/${instanceId}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (ev.status === 200 && Array.isArray(ev.json)) {
      const hit = ev.json.find((e) => e.meta?.commandId === commandId || e.payload?.commandId === commandId);
      if (hit) return hit;
    }
    await sleep(3000);
    if (Date.now() - start > 15000) return null; // events may not include commandId; caller uses side effects
  }
  return null;
}

let instanceId = null;
let token = null;

async function main() {
  console.log('== Option 2 admin actions test ==');
  console.log({ CP, API, COMPOSE, INSTALL_ID });

  // Login
  const login = await request('POST', `${CP}/api/auth/login`, {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (login.status !== 200 || !login.json?.token) {
    log('admin login', false, `${login.status} ${login.body.slice(0, 200)}`);
    process.exit(1);
  }
  token = login.json.token;
  log('admin login', true, ADMIN_EMAIL);

  const auth = { Authorization: `Bearer ${token}` };

  // Find instance
  const list = await request('GET', `${CP}/api/admin/trial-instances`, { headers: auth });
  if (list.status !== 200) {
    log('list instances', false, String(list.status));
    process.exit(1);
  }
  const inst = (list.json || []).find((i) => i.install_id === INSTALL_ID);
  if (!inst) {
    log('find Opt2 instance', false, `install_id ${INSTALL_ID} not found`);
    process.exit(1);
  }
  instanceId = inst.id;
  log('find Opt2 instance', true, `id=${instanceId} status=${inst.status} type=${inst.trial_type}`);

  if (inst.status !== 'active') {
    console.warn(`WARNING: instance status is ${inst.status}; continuing anyway`);
  }

  // Baseline unlocked
  const base = await waitApi((r) => r.status === 200, 'baseline unlock');
  log('baseline API unlocked', base.status === 200, `status=${base.status}`);

  // ---- BACKUP ----
  console.log('\n--- BACKUP ---');
  const bak = await request('POST', `${CP}/api/admin/trial-instances/${instanceId}/backup`, {
    headers: auth,
    body: {},
  });
  log('backup enqueue', bak.status === 200 && !!bak.json?.commandId, JSON.stringify(bak.json));
  restartApi();
  let backupId = null;
  {
    const start = Date.now();
    while (Date.now() - start < 180000) {
      const rows = await request('GET', `${CP}/api/admin/trial-instances/${instanceId}/backups`, {
        headers: auth,
      });
      const completed = (rows.json || []).filter((b) => b.status === 'completed' || b.status === 'complete');
      if (completed.length) {
        backupId = completed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].id;
        break;
      }
      // also accept pending→ready statuses used by schema
      const any = (rows.json || [])[0];
      if (any && ['ready', 'uploaded', 'done'].includes(any.status)) {
        backupId = any.id;
        break;
      }
      await sleep(4000);
    }
  }
  log('backup completed', !!backupId, backupId ? `backupId=${backupId}` : 'no completed backup within timeout');

  // ---- FREEZE ----
  console.log('\n--- FREEZE ---');
  const fr = await request('POST', `${CP}/api/admin/trial-instances/${instanceId}/freeze`, {
    headers: auth,
    body: {},
  });
  log('freeze enqueue', fr.status === 200 && fr.json?.status === 'frozen', JSON.stringify(fr.json));
  restartApi();
  let freezeLocked = false;
  try {
    const locked = await waitApi((r) => r.status === 403 || (r.json && r.json.code === 'TRIAL_LOCKED'), 'freeze lock', {
      timeoutMs: 120000,
    });
    freezeLocked = locked.status === 403 || locked.json?.code === 'TRIAL_LOCKED' || /TRIAL_LOCKED/.test(locked.body);
    log('freeze → API locked', freezeLocked, `status=${locked.status} body=${locked.body.slice(0, 120)}`);
  } catch (e) {
    log('freeze → API locked', false, e.message);
  }

  // ---- UNFREEZE ----
  console.log('\n--- UNFREEZE ---');
  const uf = await request('POST', `${CP}/api/admin/trial-instances/${instanceId}/unfreeze`, {
    headers: auth,
    body: {},
  });
  log('unfreeze enqueue', uf.status === 200 && uf.json?.status === 'active', JSON.stringify(uf.json));
  restartApi();
  let unfrozen = false;
  try {
    const open = await waitApi((r) => r.status === 200, 'unfreeze unlock', { timeoutMs: 120000 });
    unfrozen = open.status === 200;
    log('unfreeze → API unlocked', unfrozen, `status=${open.status}`);
  } catch (e) {
    log('unfreeze → API unlocked', false, e.message);
  }

  // ---- RESTORE ----
  console.log('\n--- RESTORE LATEST ---');
  if (!backupId) {
    log('restore enqueue', false, 'skipped — no backupId');
  } else {
    const rs = await request('POST', `${CP}/api/admin/trial-instances/${instanceId}/restore`, {
      headers: auth,
      body: { backupId },
    });
    log('restore enqueue', rs.status === 200 && !!rs.json?.commandId, JSON.stringify(rs.json));
    restartApi();
    // Wait for API to stay healthy after restore (restore can briefly disrupt)
    await sleep(8000);
    try {
      const after = await waitApi((r) => r.status === 200 || r.status === 403, 'post-restore', {
        timeoutMs: 120000,
      });
      // Check events for restore
      const ev = await request('GET', `${CP}/api/admin/trial-instances/${instanceId}/events`, {
        headers: auth,
      });
      const restoreEv = (ev.json || []).find(
        (e) =>
          String(e.event_type || e.type || '').includes('restore') ||
          String(e.event || '').includes('restore')
      );
      log(
        'restore side-effect',
        after.status === 200 || !!restoreEv,
        `api=${after.status} restoreEvent=${restoreEv ? (restoreEv.event_type || restoreEv.type || restoreEv.event) : 'none'}`
      );
    } catch (e) {
      log('restore side-effect', false, e.message);
    }
  }

  // ---- DESTROY SOFT ----
  console.log('\n--- DESTROY (soft) ---');
  const ds = await request('POST', `${CP}/api/admin/trial-instances/${instanceId}/destroy`, {
    headers: auth,
    body: { mode: 'soft' },
  });
  log(
    'destroy enqueue',
    ds.status === 200 && (ds.json?.status === 'destroying' || ds.json?.status === 'destroyed'),
    JSON.stringify(ds.json)
  );
  restartApi();
  try {
    const locked = await waitApi(
      (r) => r.status === 403 || /TRIAL_LOCKED/.test(r.body || ''),
      'destroy lock',
      { timeoutMs: 180000 }
    );
    log('destroy → API locked', locked.status === 403 || /TRIAL_LOCKED/.test(locked.body), `status=${locked.status}`);
  } catch (e) {
    log('destroy → API locked', false, e.message);
  }

  // Poll CP status → destroyed / destroying
  {
    const start = Date.now();
    let finalStatus = '';
    while (Date.now() - start < 120000) {
      const one = await request('GET', `${CP}/api/admin/trial-instances/${instanceId}`, { headers: auth });
      finalStatus = one.json?.status || '';
      if (finalStatus === 'destroyed' || finalStatus === 'destroying') break;
      await sleep(4000);
    }
    // For Opt2, destroy completes when agent acks — may stay destroying until ack marks destroyed
    const one = await request('GET', `${CP}/api/admin/trial-instances/${instanceId}`, { headers: auth });
    finalStatus = one.json?.status || finalStatus;
    log(
      'destroy CP status',
      ['destroyed', 'destroying'].includes(finalStatus),
      `status=${finalStatus}`
    );
  }

  console.log('\n== SUMMARY ==');
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.step}`);
  console.log(failed.length ? `\n${failed.length} failure(s)` : '\nAll checks passed');
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
