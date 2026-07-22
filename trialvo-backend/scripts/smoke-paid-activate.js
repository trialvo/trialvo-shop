/**
 * Smoke TS-6.2: freeze an instance → activatePaidInstance → active + commands + idempotent.
 * Usage: node scripts/smoke-paid-activate.js
 */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { activatePaidInstance, resolveInstanceForOrder } = require('../src/services/trialActivation');
const { getTrialSettings } = require('../src/services/trialSettings');

(async () => {
  const settings = await getTrialSettings();
  console.log('paidExtendDays=', settings.paidExtendDays);

  const { rows: instances } = await pool.query(
    'SELECT id, status FROM trial_instances ORDER BY created_at DESC LIMIT 1'
  );
  if (!instances.length) {
    console.log('SKIP: no trial_instances to test');
    process.exit(0);
  }

  const id = instances[0].id;
  await pool.query(
    "UPDATE trial_instances SET status = 'frozen', frozen_at = NOW(), updated_at = NOW() WHERE id = $1",
    [id]
  );

  const orderId = `SMOKE-${Date.now()}`;
  const r1 = await activatePaidInstance(id, { orderId, days: settings.paidExtendDays, source: 'smoke' });
  console.log('activate#1', r1);

  const after = await pool.query('SELECT status, meta, expires_at FROM trial_instances WHERE id = $1', [id]);
  console.log('status=', after.rows[0].status, 'paid_order_id=', after.rows[0].meta?.paid_order_id);

  const cmds = await pool.query(
    `SELECT command FROM remote_commands
     WHERE instance_id = $1 AND created_at > NOW() - INTERVAL '2 minutes'
     ORDER BY created_at DESC LIMIT 5`,
    [id]
  );
  console.log('recent commands=', cmds.rows.map((c) => c.command));

  const r2 = await activatePaidInstance(id, { orderId, source: 'smoke' });
  console.log('activate#2 (idempotent)', r2);

  const instFull = await pool.query(
    `SELECT ti.id, ti.product_id, tr.email
     FROM trial_instances ti
     JOIN trial_requests tr ON tr.id = ti.request_id
     WHERE ti.id = $1`,
    [id]
  );
  if (instFull.rows.length) {
    const resolved = await resolveInstanceForOrder({
      product_id: instFull.rows[0].product_id,
      customer_email: instFull.rows[0].email,
      trial_instance_id: null,
    });
    console.log('email+product resolve=', resolved);
  }

  const ok =
    r1.ok &&
    !r1.skipped &&
    r2.skipped &&
    after.rows[0].status === 'active' &&
    cmds.rows.some((c) => c.command === 'unfreeze') &&
    cmds.rows.some((c) => c.command === 'extend');

  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
