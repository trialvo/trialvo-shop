const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { decrypt } = require('../utils/crypto');
const { logEvent } = require('./trialEvents');
const { getTrialSettings } = require('./trialSettings');
const { isSharedDemoInstance, reactivateTrialAdmin } = require('./sharedDemoProvisioner');

async function enqueueCommand(instanceId, command, payload = null) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO remote_commands (id, instance_id, command, payload, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [id, instanceId, command, payload ? JSON.stringify(payload) : null]
  );
  return id;
}

/**
 * After product payment: unfreeze + extend trial instance.
 * Idempotent per order via meta.paid_order_id.
 * Shared demo: reactivate ADMIN only (no license-agent commands).
 */
async function activatePaidInstance(instanceId, { orderId, days, source = 'payment_ipn' } = {}) {
  const { rows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [instanceId]);
  if (!rows.length) {
    return { ok: false, reason: 'instance_not_found' };
  }

  const instance = rows[0];
  const meta = (typeof instance.meta === 'object' && instance.meta) ? { ...instance.meta } : {};

  if (orderId && meta.paid_order_id && String(meta.paid_order_id) === String(orderId)) {
    return { ok: true, skipped: true, reason: 'already_activated_for_order', instanceId };
  }

  let extendDays = days;
  if (!extendDays) {
    const settings = await getTrialSettings();
    extendDays = settings.paidExtendDays || 365;
  }
  extendDays = Math.max(1, Math.min(parseInt(extendDays, 10) || 365, 3650));

  meta.paid_order_id = orderId || meta.paid_order_id || null;
  meta.paid_at = new Date().toISOString();
  meta.paid_source = source;
  meta.paid_extend_days = extendDays;

  await pool.query(
    `UPDATE trial_instances SET
       status = 'active',
       frozen_at = NULL,
       expires_at = DATE_ADD(COALESCE(expires_at, NOW()), INTERVAL ? DAY),
       meta = ?,
       updated_at = NOW()
     WHERE id = ?`,
    [extendDays, JSON.stringify(meta), instanceId]
  );

  if (isSharedDemoInstance(instance)) {
    const password = instance.admin_password_enc ? decrypt(instance.admin_password_enc) : null;
    await reactivateTrialAdmin({ email: instance.admin_email, password });
    await logEvent(instanceId, 'paid_activate_shared_demo', {
      orderId,
      days: extendDays,
      source,
      previousStatus: instance.status,
    });
    return {
      ok: true,
      instanceId,
      days: extendDays,
      previousStatus: instance.status,
      sharedDemo: true,
    };
  }

  await enqueueCommand(instanceId, 'unfreeze', null);
  await enqueueCommand(instanceId, 'extend', { days: extendDays });
  await logEvent(instanceId, 'paid_activate', {
    orderId,
    days: extendDays,
    source,
    previousStatus: instance.status,
  });

  return { ok: true, instanceId, days: extendDays, previousStatus: instance.status };
}

/**
 * Resolve which trial instance a paid order should activate.
 * Prefer explicit orders.trial_instance_id; else email + product match.
 */
async function resolveInstanceForOrder(order) {
  if (order.trial_instance_id) {
    const { rows } = await pool.query(
      'SELECT id FROM trial_instances WHERE id = $1',
      [order.trial_instance_id]
    );
    if (rows.length) return rows[0].id;
  }

  if (!order.customer_email || !order.product_id) return null;

  const { rows } = await pool.query(
    `SELECT ti.id
     FROM trial_instances ti
     JOIN trial_requests tr ON tr.id = ti.request_id
     WHERE ti.product_id = $1
       AND LOWER(tr.email) = LOWER($2)
       AND ti.status IN ('active', 'frozen', 'expired', 'provisioning')
     ORDER BY ti.created_at DESC
     LIMIT 1`,
    [order.product_id, order.customer_email]
  );

  return rows[0]?.id || null;
}

async function activateFromPaidOrder(order) {
  const instanceId = await resolveInstanceForOrder(order);
  if (!instanceId) {
    return { ok: false, reason: 'no_matching_instance' };
  }

  const settings = await getTrialSettings();
  let days = settings.paidExtendDays || 365;
  if (order.order_kind === 'trial_extend') {
    days = order.extend_days || settings.extendDays || 30;
  }

  return activatePaidInstance(instanceId, {
    orderId: order.order_id || order.id,
    days,
    source: order.order_kind === 'trial_extend' ? 'trial_extend_payment' : 'payment_ipn',
  });
}

module.exports = {
  activatePaidInstance,
  activateFromPaidOrder,
  resolveInstanceForOrder,
  enqueueCommand,
};
