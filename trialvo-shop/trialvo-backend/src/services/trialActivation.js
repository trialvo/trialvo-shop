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

function parseInstanceMeta(meta) {
  if (!meta) return {};
  if (typeof meta === 'object') return { ...meta };
  try { return JSON.parse(meta); } catch { return {}; }
}

function isManualInstance(instance) {
  const meta = parseInstanceMeta(instance?.meta);
  return instance?.provision_mode === 'manual' || meta.provisionMode === 'manual';
}

async function enqueueCommand(instanceId, command, payload = null) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO remote_commands (id, instance_id, command, payload, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [id, instanceId, command, payload ? JSON.stringify(payload) : null]
  );
  return id;
}

async function markConverted(requestId, orderId) {
  if (!requestId) return;
  const { STAGES, setStage } = require('./trialFulfillment');
  await setStage(requestId, STAGES.CONVERTED, {
    by: null,
    note: `order ${orderId || ''}`.trim(),
    force: true,
  }).catch((e) => console.error('[trialActivation] converted stage failed', e.message));
}

/**
 * After product payment: unfreeze + extend trial instance, mark paid when applicable.
 * Idempotent per order via meta.paid_order_id.
 * Shared demo: never promote to instance_kind=paid; extend + reactivate ADMIN only.
 */
async function activatePaidInstance(instanceId, { orderId, days, source = 'payment_ipn', entitlementId = null } = {}) {
  const { rows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [instanceId]);
  if (!rows.length) {
    return { ok: false, reason: 'instance_not_found' };
  }

  const instance = rows[0];
  const meta = parseInstanceMeta(instance.meta);

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

  // Harden: a shared demo row must never become a paid shop. Extend +
  // reactivate ADMIN only so a future caller cannot poison the shared seat.
  if (isSharedDemoInstance(instance) && promoteToPaid) {
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
    const password = instance.admin_password_enc ? decrypt(instance.admin_password_enc) : null;
    await reactivateTrialAdmin({ email: instance.admin_email, password, instance });
    await logEvent(instanceId, 'paid_activate_shared_demo', {
      orderId, days: extendDays, source, previousStatus: instance.status, skippedPaidPromotion: true,
    });
    return {
      ok: true,
      instanceId,
      days: extendDays,
      previousStatus: instance.status,
      sharedDemo: true,
      skippedPaidPromotion: true,
    };
  }

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
    // trial_extend (and already-paid): extend expiry without changing kind
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

  // Product purchase on agent or manual → pipeline CONVERTED. Shared demos
  // never reach here with promoteToPaid (hardened above).
  if (promoteToPaid && instance.request_id) {
    await markConverted(instance.request_id, orderId);
  }

  const manual = isManualInstance(instance);
  if (manual) {
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

async function notifyPaidOrderStaff(order, result) {
  if (!result || result.ok === false || result.skipped) return;
  let product = null;
  if (order.product_id) {
    const { rows } = await pool.query(
      'SELECT id, slug, name FROM products WHERE id = $1',
      [order.product_id]
    );
    product = rows[0] || null;
  }

  const { notifyStaffPurchase, notifyStaffTrialExtend } = require('./staffAlerts');
  if (order.order_kind === 'trial_extend') {
    let instance = result.instanceId ? { id: result.instanceId, days: result.days } : null;
    if (result.instanceId) {
      const { rows } = await pool.query(
        'SELECT id, domain, shop_url, expires_at FROM trial_instances WHERE id = $1',
        [result.instanceId]
      );
      if (rows[0]) instance = { ...rows[0], days: result.days };
    }
    await notifyStaffTrialExtend({ order, instance, product });
    return;
  }

  await notifyStaffPurchase({ order, product });
}

/**
 * Payment success: issue entitlement; activate matching trial OR create paid deployment seat.
 */
async function activateFromPaidOrder(order) {
  const result = await activateFromPaidOrderCore(order);
  if (result && result.ok !== false && !result.skipped) {
    setImmediate(() => {
      notifyPaidOrderStaff(order, result).catch((e) =>
        console.error('[trialActivation] staff alert failed:', e.message)
      );
    });
  }
  return result;
}

async function activateFromPaidOrderCore(order) {
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
  if (!instanceId) {
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

  const { rows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [instanceId]);
  const inst = rows[0];
  const orderId = order.order_id || order.id;
  const packFields = {
    entitlementId: entitlement.id,
    licenseKey: created ? licenseKey : null,
    packToken: created ? packToken : null,
  };

  // A. Shared demo — never promote the shared row. Fresh paid seat for the pack.
  if (isSharedDemoInstance(inst)) {
    const paid = await provisionPaidDeployment({
      entitlement,
      domain: null,
      hostMode: 'docker',
      adminEmail: order.customer_email,
    });
    await logEvent(paid.instanceId, 'paid_from_shared_demo', {
      orderId,
      demoInstanceId: inst.id,
    });
    return {
      ok: true,
      instanceId: paid.instanceId,
      installId: paid.installId,
      days,
      ...packFields,
      freshPaidDeployment: true,
      sourceDemoInstanceId: inst.id,
    };
  }

  // B. Manual — extend the live shop + CONVERTED, but pack secrets come from
  // a new paid seat (manual rows have no agent secrets). Provision first so
  // the live shop does not consume the single install seat.
  if (isManualInstance(inst)) {
    const paid = await provisionPaidDeployment({
      entitlement,
      domain: null,
      hostMode: 'docker',
      adminEmail: order.customer_email,
    });
    const act = await activatePaidInstance(instanceId, {
      orderId,
      days,
      source: 'payment_ipn',
      entitlementId: entitlement.id,
    });
    await logEvent(paid.instanceId, 'paid_from_manual', {
      orderId,
      manualLiveInstanceId: inst.id,
    });
    return {
      ...act,
      instanceId: paid.instanceId,
      installId: paid.installId,
      days,
      ...packFields,
      freshPaidDeployment: true,
      manualLiveInstanceId: inst.id,
    };
  }

  // C. Agent / default — same instance has secrets; mark CONVERTED inside activatePaidInstance
  const act = await activatePaidInstance(instanceId, {
    orderId,
    days,
    source: 'payment_ipn',
    entitlementId: entitlement.id,
  });
  return {
    ...act,
    ...packFields,
  };
}

module.exports = {
  activatePaidInstance,
  activateFromPaidOrder,
  resolveInstanceForOrder,
  enqueueCommand,
};
