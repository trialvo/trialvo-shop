/**
 * Cleanup local Opt2 Docker stacks + CP trial/paid test rows.
 * Keeps products/admin; removes trial_instances, entitlements, related events/commands/backups,
 * and demo trial_requests used by local installer tests.
 *
 *   node scripts/cleanup-local-trial-data.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { pool } = require('../src/config/db');

function tearDownOpt2Dirs() {
  const temp = process.env.TEMP || process.env.TMP || '';
  if (!temp || !fs.existsSync(temp)) return [];
  const dirs = fs.readdirSync(temp).filter((n) => n.startsWith('opt2-'));
  const torn = [];
  for (const name of dirs) {
    const compose = path.join(temp, name, 'docker-compose.yml');
    if (fs.existsSync(compose)) {
      try {
        console.log('compose down', name);
        execSync(`docker compose -f "${compose}" down -v --remove-orphans`, {
          stdio: 'inherit',
          windowsHide: true,
        });
        torn.push(name);
      } catch (e) {
        console.warn('compose down failed', name, e.message);
      }
    }
  }
  // Remove leftover containers by name prefix
  try {
    const out = execSync('docker ps -aq --filter name=opt2-', { encoding: 'utf8' }).trim();
    if (out) {
      execSync(`docker rm -f ${out.split(/\s+/).join(' ')}`, { stdio: 'inherit', windowsHide: true });
    }
  } catch {
    /* none */
  }
  return torn;
}

(async () => {
  console.log('==> Docker Opt2 stacks');
  const torn = tearDownOpt2Dirs();
  console.log('torn stacks', torn.length);

  console.log('==> DB cleanup');
  // Order: commands/events/backups → instances → entitlements → demo requests
  await pool.query('DELETE FROM remote_commands');
  await pool.query('DELETE FROM instance_events');
  await pool.query('DELETE FROM instance_backups');
  await pool.query('DELETE FROM trial_instances');
  await pool.query('DELETE FROM license_entitlements');

  // Local installer / smoke trial requests
  await pool.query(
    `DELETE FROM trial_requests WHERE
       email LIKE '%@trialvo.demo'
       OR email LIKE 'opt2-test%'
       OR email LIKE 'paid-smoke%'
       OR email LIKE 'backup-test%'
       OR customer_name IN ('Opt2 Test','Backup Test','Paid Smoke')`
  );

  // Clear orphaned extend/product order links if any test orders
  try {
    await pool.query(
      `UPDATE orders SET trial_instance_id = NULL
       WHERE customer_email LIKE '%@trialvo.demo' OR customer_email LIKE 'paid-smoke%'`
    );
  } catch {
    /* column may not exist on all envs */
  }

  const counts = {};
  for (const t of [
    'trial_instances',
    'license_entitlements',
    'remote_commands',
    'instance_events',
    'instance_backups',
  ]) {
    const { rows } = await pool.query(`SELECT COUNT(*) AS c FROM ${t}`);
    counts[t] = rows[0].c;
  }
  console.log('remaining counts', counts);
  console.log('\n✅ CLEANUP DONE');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
