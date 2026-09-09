const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { decrypt } = require('../utils/crypto');
const { logEvent } = require('./trialEvents');
const { getTrialSettings } = require('./trialSettings');
const { isSharedDemoInstance, reactivateTrialAdmin } = require('./sharedDemoProvisioner');
const {
  issueEntitlementForOrder,
  provisionPaidDeployment,
} = require('./licenseEntitlements');

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
 * After product payment: unfreeze + extend trial instance, mark paid when applicable.
 * Idempotent per order via meta.paid_order_id.
 * Shared demo: reactivate ADMIN only (no license-agent commands).
 */
async function activatePaidInstance(instanceId, { orderId, days, source = 'payment_ipn', entitlementId = null } = {}) {
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

  const promoteToPaid = source === 'payment_ipn' || source === 'product_purchase';

  if (promoteToPaid && instance.instance_kind === 'trial') {
    await pool.query(
      `UPDATE trial_instances SET
         status = 'active',
         frozen_at = NULL,
         instance_kind = 'paid',
         entitlement_id = COALESCE($1, entitlement_id),
         expires_at = DATE_ADD(GREATEST(COALESCE(expires_at, NOW()), NOW()), INTERVAL $2 DAY),
         meta = $3,
         updated_at = NOW()
       WHERE id = $4`,
      [entitlementId, extendDays, JSON.stringify(meta), instanceId]
    );
  } else {
    await pool.query(
      `UPDATE trial_instances SET
         status = 'active',
         frozen_at = NULL,
         expires_at = DATE_ADD(GREATEST(COALESCE(expires_at, NOW()), NOW()), INTERVAL $1 DAY),
         meta = $2,
         updated_at = NOW()
       WHERE id = $3`,
      [extendDays, JSON.stringify(meta), instanceId]
    );
  }

  // Own-domain trial bought → stays on the customer's server as-is. Nothing to
  // unfreeze remotely (no agent); just mark the pipeline converted.
  const manual = instance.provision_mode === 'manual' || meta.provisionMode === 'manual';
  if (manual) {
    if (instance.request_id) {
      const { STAGES, setStage } = require('./trialFulfillment');
      await setStage(instance.request_id, STAGES.CONVERTED, { by: null, note: `order ${orderId || ''}`.trim(), force: true })
        .catch((e) => console.error('[trialActivation] converted stage failed', e.message));
    }
    await logEvent(instanceId, 'paid_activate_manual', {
      orderId, days: extendDays, source, previousStatus: instance.status, promotedToPaid: promoteToPaid,
    });
    return { ok: true, instanceId, days: extendDays, previousStatus: instance.status, manual: true };
  }

  if (isSharedDemoInstance(instance)) {
    const password = instance.admin_password_enc ? decrypt(instance.admin_password_enc) : null;
    await reactivateTrialAdmin({ email: instance.admin_email, password, instance });
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
    promotedToPaid: promoteToPaid,
    entitlementId,
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

/**
 * Payment success: issue entitlement; activate matching trial OR create paid deployment seat.
 */
async function activateFromPaidOrder(order) {
  const settings = await getTrialSettings();
  let days = settings.paidExtendDays || 365;
  if (order.order_kind === 'trial_extend') {
    days = order.extend_days || settings.extendDays || 30;
  }

  // Extend-only packs: do not issue full product entitlement / paid pack.
  if (order.order_kind === 'trial_extend') {
    const instanceId = await resolveInstanceForOrder(order);
    if (!instanceId) return { ok: false, reason: 'no_matching_instance' };
    return activatePaidInstance(instanceId, {
      orderId: order.order_id || order.id,
      days,
      source: 'trial_extend_payment',
    });
  }

  const { entitlement, licenseKey, packToken, created } = await issueEntitlementForOrder(order, {
    maxInstalls: 1,
    daysValid: Math.max(days, 365),
  });

  const instanceId = await resolveInstanceForOrder(order);
  if (instanceId) {
    const act = await activatePaidInstance(instanceId, {
      orderId: order.order_id || order.id,
      days,
      source: 'payment_ipn',
      entitlementId: entitlement.id,
    });
    return {
      ...act,
      entitlementId: entitlement.id,
      licenseKey: created ? licenseKey : null,
      packToken: created ? packToken : null,
    };
  }

  // No prior trial — provision a paid deployment seat + pack secrets
  const paid = await provisionPaidDeployment({
    entitlement,
    domain: null,
    hostMode: 'docker',
    adminEmail: order.customer_email,
  });

  await logEvent(paid.instanceId, 'paid_deploy_from_order', {
    orderId: order.order_id || order.id,
    entitlementId: entitlement.id,
  });

  return {
    ok: true,
    instanceId: paid.instanceId,
    installId: paid.installId,
    days,
    entitlementId: entitlement.id,
    licenseKey: created ? licenseKey : null,
    packToken: created ? packToken : null,
    freshPaidDeployment: true,
  };
}

module.exports = {
  activatePaidInstance,
  activateFromPaidOrder,
  resolveInstanceForOrder,
  enqueueCommand,
};
