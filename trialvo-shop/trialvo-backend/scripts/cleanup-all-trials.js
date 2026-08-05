/**
 * Tear down every local Option-1 Docker trial stack and wipe trial_* rows
 * so QA can start from a clean Control Plane.
 *
 * Usage: node scripts/cleanup-all-trials.js
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');
const { destroyDockerStack, TRIALS_ROOT } = require('../src/services/dockerProvisioner');

async function main() {
  const dirs = fs.existsSync(TRIALS_ROOT)
    ? fs.readdirSync(TRIALS_ROOT).filter((name) => {
      const full = path.join(TRIALS_ROOT, name);
      return fs.statSync(full).isDirectory();
    })
    : [];

  console.log(`Docker trial folders: ${dirs.length} under ${TRIALS_ROOT}`);
  for (const name of dirs) {
    const projectDir = path.join(TRIALS_ROOT, name);
    const result = await destroyDockerStack(projectDir, { hard: true });
    console.log(`  ${name}: ${result.ok ? 'down' : result.error}`);
  }

  // Child tables first (FK order), then instances, then requests.
  await pool.query(`
    UPDATE orders SET trial_instance_id = NULL WHERE trial_instance_id IS NOT NULL
  `).catch(() => {});

  const tables = [
    'remote_commands',
    'instance_events',
    'instance_backups',
    'trial_instances',
    'trial_requests',
  ];
  for (const table of tables) {
    const { rowCount } = await pool.query(`DELETE FROM ${table}`);
    console.log(`DB ${table}: deleted ${rowCount ?? 0}`);
  }

  console.log('Cleanup complete — ready for a fresh trial request.');
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
