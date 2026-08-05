/**
 * Smoke: Opt2 backup v3 size + migration export + restore enqueue.
 * Assumes an ACTIVE self_hosted Opt2 stack (from test-installer-local KEEP=1).
 *
 *   node scripts/smoke-backup-v3.js [installId]
 */
const http = require('http');
const { execSync } = require('child_process');
const path = require('path');

const CP = process.env.CP_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@trialvo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Antor@123';
const INSTALL_ID = process.argv[2] || process.env.OPT2_INSTALL_ID || '';

function request(method, urlStr, { headers = {}, body, raw = false } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = body != null ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method,
        headers: {
          Accept: raw ? '*/*' : 'application/json',
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
          ...headers,
        },
        timeout: 120000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: buf,
            json: (() => {
              try {
                return JSON.parse(buf.toString('utf8'));
              } catch {
                return null;
              }
            })(),
          });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const login = await request('POST', `${CP}/api/auth/login`, {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (!login.json?.token) throw new Error('login failed: ' + login.body.toString().slice(0, 200));
  const auth = { Authorization: `Bearer ${login.json.token}` };

  const list = await request('GET', `${CP}/api/admin/trial-instances`, { headers: auth });
  let inst = (list.json || []).find(
    (i) =>
      i.trial_type === 'self_hosted' &&
      i.status === 'active' &&
      (!INSTALL_ID || i.install_id === INSTALL_ID)
  );
  if (!inst) {
    inst = (list.json || []).find((i) => i.trial_type === 'self_hosted' && i.status === 'active');
  }
  if (!inst) throw new Error('No active self_hosted instance — run test-installer-local.js KEEP=1 first');

  console.log('instance', inst.id, inst.install_id, inst.status);

  // Find compose dir from install_id prefix
  const short = String(inst.install_id).slice(0, 8);
  const compose = path.join(process.env.TEMP || '/tmp', `opt2-${short}`, 'docker-compose.yml');
  console.log('compose', compose);

  const bak = await request('POST', `${CP}/api/admin/trial-instances/${inst.id}/backup`, {
    headers: auth,
    body: {},
  });
  console.log('backup enqueue', bak.status, bak.json);
  execSync(`docker compose -f "${compose}" restart api`, { stdio: 'inherit' });

  let backup = null;
  const start = Date.now();
  while (Date.now() - start < 180000) {
    const rows = await request('GET', `${CP}/api/admin/trial-instances/${inst.id}/backups`, {
      headers: auth,
    });
    const completed = (rows.json || []).filter((b) => b.status === 'completed');
    if (completed.length) {
      backup = completed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      break;
    }
    await sleep(4000);
  }
  if (!backup) throw new Error('backup did not complete');
  console.log(
    'backup completed',
    backup.id,
    'size_bytes=',
    backup.size_bytes,
    `(${(backup.size_bytes / 1024 / 1024).toFixed(2)} MB)`,
    'trigger=',
    backup.trigger
  );

  // Retention: should be <= BACKUP_KEEP_COUNT (default 2)
  const all = await request('GET', `${CP}/api/admin/trial-instances/${inst.id}/backups`, {
    headers: auth,
  });
  const completedCount = (all.json || []).filter((b) => b.status === 'completed').length;
  console.log('completed backups kept:', completedCount, '(expect <= 2)');

  // Migration export
  const exp = await request('GET', `${CP}/api/admin/trial-instances/${inst.id}/export-backup`, {
    headers: auth,
    raw: true,
  });
  const isZip = exp.status === 200 && exp.body[0] === 0x50 && exp.body[1] === 0x4b;
  console.log(
    'export',
    exp.status,
    'bytes=',
    exp.body.length,
    `(${(exp.body.length / 1024 / 1024).toFixed(2)} MB)`,
    'zip=',
    isZip,
    'format=',
    exp.headers['x-backup-format']
  );

  // Restore enqueue
  const rs = await request('POST', `${CP}/api/admin/trial-instances/${inst.id}/restore`, {
    headers: auth,
    body: { backupId: backup.id },
  });
  console.log('restore enqueue', rs.status, rs.json);
  execSync(`docker compose -f "${compose}" restart api`, { stdio: 'inherit' });
  await sleep(15000);
  // Poll command via events isn't required — check API still responds
  const apiPort = (() => {
    try {
      const envPath = path.join(process.env.TEMP || '/tmp', `opt2-${short}`, '.env');
      const txt = require('fs').readFileSync(envPath, 'utf8');
      const m = txt.match(/^API_PORT=(\d+)/m);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  })();
  if (apiPort) {
    const a = await request('GET', `http://localhost:${apiPort}/api/v1/user/analytics`);
    console.log('post-restore analytics', a.status);
  }

  const ok = backup.size_bytes > 0 && isZip && completedCount <= 2 && rs.status === 200;
  console.log(ok ? '\n✅ BACKUP V3 SMOKE PASS' : '\n⚠️ SMOKE INCOMPLETE');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
