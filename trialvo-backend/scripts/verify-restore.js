/* Focused restore verification against an already-provisioned local stack.
 * Usage: node scripts/verify-restore.js <instanceId> <backupId> <projectDir>
 */
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function composeExec(cf, dir, service, cmd) {
  const { stdout } = await execFileAsync('docker',
    ['compose', '-f', cf, 'exec', '-T', service, 'sh', '-lc', cmd],
    { cwd: dir, timeout: 120000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  return stdout.toString().trim();
}

(async () => {
  const [instanceId, backupId, projectDir] = process.argv.slice(2);
  const cf = path.join(projectDir, 'docker-compose.yml');
  const dbPw = await composeExec(cf, projectDir, 'db', 'printenv MYSQL_ROOT_PASSWORD');
  const mysql = (sql) => composeExec(cf, projectDir, 'db', `mysql -uroot -p${dbPw} -N -e "${sql}" ecom`);

  const table = 'location_mappings';
  const before = parseInt(await mysql(`SELECT COUNT(*) FROM \\\`${table}\\\``), 10);
  console.log(`${table} rows (pre-delete) =`, before);
  if (before > 0) {
    await mysql(`DELETE FROM \\\`${table}\\\``);
    console.log(`${table} rows after delete =`, await mysql(`SELECT COUNT(*) FROM \\\`${table}\\\``));
  }

  const cmdId = uuidv4();
  await pool.query(
    "INSERT INTO remote_commands (id, instance_id, command, payload, status) VALUES ($1,$2,'restore',$3,'pending')",
    [cmdId, instanceId, JSON.stringify({ backupId })]
  );
  console.log('enqueued restore', cmdId, '; force-recreating api...');
  await execFileAsync('docker', ['compose', '-f', cf, 'up', '-d', '--force-recreate', 'api'],
    { cwd: projectDir, timeout: 90000, windowsHide: true });

  const deadline = Date.now() + 240000;
  let st = 'pending';
  let result = null;
  while (Date.now() < deadline) {
    const { rows } = await pool.query('SELECT status, result FROM remote_commands WHERE id = $1', [cmdId]);
    st = rows[0]?.status;
    result = rows[0]?.result;
    if (st === 'succeeded' || st === 'failed') break;
    await sleep(4000);
  }
  console.log('restore status:', st);
  console.log('restore result:', typeof result === 'string' ? result.slice(0, 300) : JSON.stringify(result)?.slice(0, 300));

  await sleep(2000);
  const after = parseInt(await mysql(`SELECT COUNT(*) FROM \\\`${table}\\\``), 10);
  console.log(`after restore, ${table} rows =`, after);
  console.log(st === 'succeeded' && after > 0 ? '\n✅ RESTORE VERIFIED' : '\n⚠️ restore not verified');
  await pool.end();
  process.exit(st === 'succeeded' && after > 0 ? 0 : 2);
})().catch(async (e) => { console.error('ERR', e.message); try { await pool.end(); } catch {} process.exit(1); });
