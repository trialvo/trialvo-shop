/* Phase 3 verify — confirm the in-container Node client executes remote commands
 * on the ALREADY-RUNNING Option 2 stack (left up by test-installer-local.js KEEP=1).
 *
 * Enqueues a backup_now command, restarts the api container to trigger a boot
 * heartbeat (the Node client's command-delivery poll), then confirms the command
 * succeeded and the encrypted blob landed on the Control Plane. This proves the
 * split-responsibility design: Go agent owns the lease gate, Node client owns
 * command execution (mysqldump -> encrypt -> upload).
 *
 * Run: node scripts/verify-opt2-backup.js
 */
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  // Locate the most recent self_hosted (Option 2) instance still active.
  const inst = await pool.query(
    "SELECT id, install_id, meta FROM trial_instances WHERE trial_type = 'self_hosted' AND status = 'active' ORDER BY created_at DESC LIMIT 1"
  );
  if (!inst.rows.length) throw new Error('No active self_hosted instance found — is the KEEP=1 stack still up?');
  const instanceId = inst.rows[0].id;
  const installId = inst.rows[0].install_id;
  console.log(`==> Target Option 2 instance ${instanceId} (install ${installId})`);

  // The installer dir was created under the OS temp dir as opt2-<install8>.
  const projectDir = path.join(require('os').tmpdir(), `opt2-${installId.slice(0, 8)}`);
  const composeFile = path.join(projectDir, 'docker-compose.yml');
  console.log(`   compose: ${composeFile}`);

  const backupCmdId = uuidv4();
  await pool.query(
    "INSERT INTO remote_commands (id, instance_id, command, status) VALUES ($1,$2,'backup_now','pending')",
    [backupCmdId, instanceId]
  );
  console.log('==> Enqueued backup_now; restarting api to trigger boot heartbeat...');
  await execFileAsync('docker', ['compose', '-f', composeFile, 'restart', 'api'],
    { cwd: projectDir, timeout: 60000, windowsHide: true });

  const res = await pollCommand(backupCmdId);
  const result = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
  console.log('   command status:', res.status);
  console.log('   result:', JSON.stringify(result)?.slice(0, 220));

  let blobOk = false;
  if (result?.backupId) {
    const bk = await pool.query('SELECT status, size_bytes FROM instance_backups WHERE id = $1', [result.backupId]);
    console.log(`   instance_backups: status=${bk.rows[0]?.status} size=${bk.rows[0]?.size_bytes}`);
    blobOk = bk.rows[0]?.status === 'completed' && Number(bk.rows[0]?.size_bytes) > 0;
  }

  const ok = res.status === 'succeeded' && blobOk;
  console.log(ok
    ? '\n✅ OPTION 2 NODE-CLIENT COMMAND EXECUTION VERIFIED (backup_now -> encrypted blob on CP)'
    : '\n⚠️ Node-client backup did not fully verify');

  await pool.end();
  process.exit(ok ? 0 : 2);
})().catch(async (e) => { console.error('ERROR:', e.message); try { await pool.end(); } catch { /* ignore */ } process.exit(1); });
