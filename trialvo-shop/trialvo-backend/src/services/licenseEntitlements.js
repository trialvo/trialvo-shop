/**
 * Paid license entitlements — one purchase → N installs (default 1).
 * Plain license keys are shown once at issue time; only SHA-256 hashes are stored.
 */
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { encrypt, randomToken, randomHex } = require('../utils/crypto');
const { logEvent } = require('./trialEvents');

function hashKey(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function parseMeta(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return { ...raw };
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function normalizeDomain(d) {
  if (!d) return '';
  return String(d).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Same install secrets on a different domain = clone/resell signal.
 * Freeze and keep the original domain until admin transfer.
 */
async function handleDomainConflict(inst, incomingDomain) {
  const prev = normalizeDomain(inst.domain);
  const next = normalizeDomain(incomingDomain);
  if (!prev || !next || prev === next) return { conflict: false };

  const meta = parseMeta(inst.meta);
  meta.domain_conflict = {
    previous: inst.domain,
    attempted: incomingDomain,
    at: new Date().toISOString(),
  };
  meta.alert = 'domain_conflict';

  await pool.query(
    `UPDATE trial_instances SET
       status = 'frozen',
       frozen_at = COALESCE(frozen_at, NOW()),
       meta = $1,
       updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(meta), inst.id]
  );
  // Push freeze to the Node license client (command channel) so panels lock
  // without waiting for the next lease tick / container restart.
  await pool.query(
    `INSERT INTO remote_commands (id, instance_id, command, payload, created_by)
     VALUES ($1, $2, 'freeze', $3, NULL)`,
    [
      uuidv4(),
      inst.id,
      JSON.stringify({ reason: 'domain_conflict', attempted: incomingDomain }),
    ]
  );
  await logEvent(inst.id, 'domain_conflict', {
    previous: inst.domain,
    attempted: incomingDomain,
    instance_kind: inst.instance_kind || 'trial',
  });
  return { conflict: true, previous: inst.domain, attempted: incomingDomain };
}

/**
 * Issue (or return existing) entitlement for a paid product order.
 * @returns {{ entitlement, licenseKey, packToken, created }}
 */
async function issueEntitlementForOrder(order, { maxInstalls = 1, daysValid = 3650 } = {}) {
  const orderId = String(order.order_id || order.id || '');
  if (!orderId) throw new Error('order id required');

  const { rows: existing } = await pool.query(
    "SELECT * FROM license_entitlements WHERE order_id = $1 AND status = 'active' LIMIT 1",
    [orderId]
  );
  if (existing.length) {
    return { entitlement: existing[0], licenseKey: null, packToken: null, created: false };
  }

  const id = uuidv4();
  const licenseKey = `tvl_${randomToken(24)}`;
  const packToken = randomToken(32);
  const hint = licenseKey.slice(-8);
  const expiresAt = new Date(Date.now() + Math.max(1, daysValid) * 86400000);

  await pool.query(
    `INSERT INTO license_entitlements
      (id, order_id, product_id, customer_email, customer_name, license_key_hash,
       license_key_hint, max_installs, status, pack_download_token_hash, expires_at, meta)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,$10,$11)`,
    [
      id,
      orderId,
      order.product_id,
      (order.customer_email || '').toLowerCase(),
      order.customer_name || null,
      hashKey(licenseKey),
      hint,
      Math.max(1, parseInt(maxInstalls, 10) || 1),
      hashKey(packToken),
      expiresAt,
      JSON.stringify({ source: 'payment_ipn' }),
    ]
  );

  const { rows } = await pool.query('SELECT * FROM license_entitlements WHERE id = $1', [id]);
  return { entitlement: rows[0], licenseKey, packToken, created: true };
}

async function countActiveInstalls(entitlementId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS c FROM trial_instances
     WHERE entitlement_id = $1
       AND instance_kind = 'paid'
       AND status NOT IN ('destroyed', 'destroying')`,
    [entitlementId]
  );
  return parseInt(rows[0]?.c || '0', 10);
}

async function findEntitlementByLicenseKey(licenseKey) {
  if (!licenseKey) return null;
  const { rows } = await pool.query(
    "SELECT * FROM license_entitlements WHERE license_key_hash = $1 AND status = 'active' LIMIT 1",
    [hashKey(licenseKey)]
  );
  return rows[0] || null;
}

/**
 * Create a paid deployment row + secrets for pack download.
 * Does not start Docker — customer deploys the pack themselves.
 */
async function provisionPaidDeployment({
  entitlement,
  domain = null,
  hostMode = 'docker', // docker | cpanel
  adminEmail = null,
}) {
  const used = await countActiveInstalls(entitlement.id);
  if (used >= (entitlement.max_installs || 1)) {
    const err = new Error('No install seats left on this license');
    err.code = 'SEAT_EXHAUSTED';
    err.status = 409;
    throw err;
  }

  const id = uuidv4();
  const installId = randomHex(16);
  const agentSecret = randomHex(32);
  const bootstrapToken = randomToken(24);
  const backupKey = randomHex(32);
  const email = adminEmail || entitlement.customer_email;

  const settings = await require('./trialSettings').getTrialSettings();
  const days = settings.paidExtendDays || 365;

  await pool.query(
    `INSERT INTO trial_instances
      (id, install_id, request_id, product_id, trial_type, instance_kind, entitlement_id,
       status, domain, admin_email, agent_secret_enc, bootstrap_token_enc, backup_key_enc,
       expires_at, meta)
     VALUES ($1,$2,NULL,$3,'self_hosted','paid',$4,'provisioning',$5,$6,$7,$8,$9,
             DATE_ADD(NOW(), INTERVAL $10 DAY), $11)`,
    [
      id,
      installId,
      entitlement.product_id,
      entitlement.id,
      domain,
      email,
      encrypt(agentSecret),
      encrypt(bootstrapToken),
      encrypt(backupKey),
      days,
      JSON.stringify({
        hostMode,
        paid: true,
        customer_email: entitlement.customer_email,
        license_hint: entitlement.license_key_hint,
      }),
    ]
  );

  await logEvent(id, 'paid_deployment_created', {
    entitlementId: entitlement.id,
    hostMode,
    domain,
  });

  return {
    instanceId: id,
    installId,
    agentSecret,
    bootstrapToken,
    backupKey,
    domain,
    adminEmail: email,
    expiresDays: days,
  };
}

/**
 * Transfer paid instance to a new domain (admin-approved).
 */
async function transferDomain(instanceId, newDomain, { by } = {}) {
  const { rows } = await pool.query('SELECT * FROM trial_instances WHERE id = $1', [instanceId]);
  if (!rows.length) {
    const err = new Error('Instance not found');
    err.status = 404;
    throw err;
  }
  const inst = rows[0];
  if (inst.instance_kind !== 'paid') {
    const err = new Error('Domain transfer only for paid deployments');
    err.status = 400;
    throw err;
  }
  const prev = inst.domain;
  await pool.query(
    `UPDATE trial_instances SET domain = $1, status = 'active', frozen_at = NULL, updated_at = NOW() WHERE id = $2`,
    [newDomain, instanceId]
  );
  await logEvent(instanceId, 'domain_transfer', { from: prev, to: newDomain, by });
  return { ok: true, from: prev, to: newDomain };
}

/**
 * Bind an unlicensed instance to an entitlement (convert to paid).
 */
async function convertUnlicensedToPaid(instanceId, entitlementId, { by } = {}) {
  const used = await countActiveInstalls(entitlementId);
  const { rows: entRows } = await pool.query(
    'SELECT * FROM license_entitlements WHERE id = $1',
    [entitlementId]
  );
  if (!entRows.length) {
    const err = new Error('Entitlement not found');
    err.status = 404;
    throw err;
  }
  const ent = entRows[0];
  if (used >= (ent.max_installs || 1)) {
    const err = new Error('No install seats left');
    err.status = 409;
    throw err;
  }

  await pool.query(
    `UPDATE trial_instances SET
       instance_kind = 'paid',
       entitlement_id = $1,
       status = 'active',
       frozen_at = NULL,
       updated_at = NOW()
     WHERE id = $2 AND instance_kind = 'unlicensed'`,
    [entitlementId, instanceId]
  );
  await logEvent(instanceId, 'convert_to_paid', { entitlementId, by });
  return { ok: true };
}

module.exports = {
  hashKey,
  parseMeta,
  normalizeDomain,
  handleDomainConflict,
  issueEntitlementForOrder,
  countActiveInstalls,
  findEntitlementByLicenseKey,
  provisionPaidDeployment,
  transferDomain,
  convertUnlicensedToPaid,
};
