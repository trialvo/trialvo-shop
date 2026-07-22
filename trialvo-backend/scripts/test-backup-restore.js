/* Phase 2 — backup/restore round-trip on a local Docker trial instance.
 *
 * Proves the full data-protection loop end to end:
 *   provision -> backup_now (mysqldump in container -> encrypt -> upload to CP)
 *   -> verify stored blob -> mutate the instance DB (delete a table's rows)
 *   -> restore (download -> decrypt -> mysql import) -> verify rows are back.
 *
 * Requires the Control Plane running on :5000 and Docker Desktop.
 * Run: DOCKER_PROVISION=1 PROVISION_MODE=local node scripts/test-backup-restore.js
 */
process.env.DOCKER_PROVISION = process.env.DOCKER_PROVISION || '1';
process.env.PROVISION_MODE = process.env.PROVISION_MODE || 'local';

const http = require('http');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const { randomToken } = require('../src/utils/crypto');
const { destroyDockerStack } = require('../src/services/dockerProvisioner');

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let b = ''; res.on('data', (d) => { b += d; }); res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(5000, () => req.destroy());
  });
}

async function composeExec(composeFile, projectDir, service, cmd) {
  const { stdout } = await execFileAsync(
    'docker',
    ['compose', '-f', composeFile, 'exec', '-T', service, 'sh', '-lc', cmd],
    { cwd: projectDir, timeout: 60000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 }
  );
  return stdout.toString().trim();
}

async function pollCommand(cmdId, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { rows } = await pool.query('SELECT status, result FROM remote_commands WHERE id = $1', [cmdId]);
    const st = rows[0]?.status;
    if (st === 'succeeded' || st === 'failed') return rows[0];
    await sleep(4000);
  }
  return { status: 'timeout' };
}

(async () => {
  // ── provision ────────────────────────────────────────────────────────────
  const prod = await pool.query("SELECT id, slug FROM products WHERE is_active = 1 ORDER BY created_at LIMIT 1");
  await pool.query('UPDATE products SET is_trialable = 1 WHERE id = $1', [prod.rows[0].id]);
  const reqId = uuidv4();
  const publicToken = randomToken(24);
  await pool.query(
    `INSERT INTO trial_requests (id, public_token, product_id, trial_type, customer_name, email, phone, requested_days)
     VALUES ($1,$2,$3,'hosted','Backup Test','backup-test@trialvo.demo','01700000000',14)`,
    [reqId, publicToken, prod.rows[0].id]
  );
  const requestRow = {
    id: reqId, public_token: publicToken, product_id: prod.rows[0].id, trial_type: 'hosted',
    customer_name: 'Backup Test', email: 'backup-test@trialvo.demo', phone: '01700000000',
  };

  console.log('==> Provisioning local stack...');
  const { provisionFromRequest } = require('../src/services/provisioner');
  try { await provisionFromRequest(requestRow, 14); } catch (e) { console.warn('   provision warn:', e.message); }

  const inst = await pool.query(
    'SELECT id, install_id, meta FROM trial_instances WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1', [reqId]
  );
  const instanceId = inst.rows[0].id;
  const meta = typeof inst.rows[0].meta === 'string' ? JSON.parse(inst.rows[0].meta) : inst.rows[0].meta;
  const projectDir = meta.docker.projectDir;
  const composeFile = path.join(projectDir, 'docker-compose.yml');
  const apiPort = meta.docker.ports.api;
  console.log(`   instanceId=${instanceId} apiPort=${apiPort}`);

  // wait for unlock so the agent loop is healthy
  for (let i = 0; i < 20; i++) {
    const r = await getJson(`http://localhost:${apiPort}/api/v1/user/analytics`);
    if (r.status === 200) break;
    await sleep(4000);
  }

  const dbPw = await composeExec(composeFile, projectDir, 'db', 'printenv MYSQL_ROOT_PASSWORD');
  const mysql = (sql) => composeExec(composeFile, projectDir, 'db', `mysql -uroot -p${dbPw} -N -e "${sql}" ecom`);

  // pick a base table with rows to use as the restore witness
  const table = await mysql(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='ecom' AND table_type='BASE TABLE' AND table_rows > 0 ORDER BY table_rows DESC LIMIT 1"
  );
  const beforeCount = parseInt(await mysql(`SELECT COUNT(*) FROM \\\`${table}\\\``), 10);
  console.log(`   witness table: ${table} (rows=${beforeCount})`);

  // ── backup ───────────────────────────────────────────────────────────────
  console.log('\n==> Enqueue backup_now + restart api to trigger boot heartbeat...');
  const backupCmdId = uuidv4();
  await pool.query(
    "INSERT INTO remote_commands (id, instance_id, command, status) VALUES ($1,$2,'backup_now','pending')",
    [backupCmdId, instanceId]
  );
  await execFileAsync('docker', ['compose', '-f', composeFile, 'restart', 'api'], { cwd: projectDir, timeout: 60000, windowsHide: true });

  const backupRes = await pollCommand(backupCmdId);
  const backupResult = typeof backupRes.result === 'string' ? JSON.parse(backupRes.result) : backupRes.result;
  console.log('   backup command status:', backupRes.status);
  console.log('   backup result:', JSON.stringify(backupResult)?.slice(0, 200));
  if (backupRes.status !== 'succeeded') throw new Error('Backup did not succeed');

  const backupId = backupResult.backupId;
  const bk = await pool.query("SELECT status, size_bytes FROM instance_backups WHERE id = $1", [backupId]);
  console.log(`   instance_backups: status=${bk.rows[0]?.status} size=${bk.rows[0]?.size_bytes}`);
  if (bk.rows[0]?.status !== 'completed') throw new Error('Backup blob not completed on CP');

  // ── mutate ───────────────────────────────────────────────────────────────
  console.log(`\n==> Deleting all rows from ${table} to simulate data loss...`);
  await mysql(`DELETE FROM \\\`${table}\\\``);
  const afterDelete = parseInt(await mysql(`SELECT COUNT(*) FROM \\\`${table}\\\``), 10);
  console.log(`   ${table} rows after delete = ${afterDelete}`);

  // ── restore ──────────────────────────────────────────────────────────────
  console.log('\n==> Enqueue restore + restart api...');
  const restoreCmdId = uuidv4();
  await pool.query(
    "INSERT INTO remote_commands (id, instance_id, command, payload, status) VALUES ($1,$2,'restore',$3,'pending')",
    [restoreCmdId, instanceId, JSON.stringify({ backupId })]
  );
  await execFileAsync('docker', ['compose', '-f', composeFile, 'restart', 'api'], { cwd: projectDir, timeout: 60000, windowsHide: true });

  const restoreRes = await pollCommand(restoreCmdId);
  const restoreResult = typeof restoreRes.result === 'string' ? JSON.parse(restoreRes.result) : restoreRes.result;
  console.log('   restore command status:', restoreRes.status);
  console.log('   restore result:', JSON.stringify(restoreResult)?.slice(0, 260));

  await sleep(3000);
  const afterRestore = parseInt(await mysql(`SELECT COUNT(*) FROM \\\`${table}\\\``), 10);
  console.log(`\n   ${table} rows: before=${beforeCount}, afterDelete=${afterDelete}, afterRestore=${afterRestore}`);

  const sqlOk = restoreResult?.sqlImport?.ok === true;
  console.log('   sqlImport.ok =', sqlOk, sqlOk ? '' : `(err: ${String(restoreResult?.sqlImport?.error).slice(0, 160)})`);
  const ok = restoreRes.status === 'succeeded' && afterRestore === beforeCount && beforeCount > 0 && sqlOk;
  console.log(ok ? '\n✅ BACKUP/RESTORE ROUND-TRIP VERIFIED (clean SQL import incl. binary columns)' : '\n⚠️ Round-trip did not fully verify');

  // ── cleanup ──────────────────────────────────────────────────────────────
  if (process.env.KEEP !== '1') {
    console.log('\n==> Destroying stack...');
    console.log('destroy:', await destroyDockerStack(projectDir, { hard: true }));
  } else {
    console.log(`\n==> KEEP=1; stack left at http://localhost:${apiPort}`);
  }
  await pool.end();
  process.exit(ok ? 0 : 2);
})().catch(async (e) => {
  console.error('ERROR:', e.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
