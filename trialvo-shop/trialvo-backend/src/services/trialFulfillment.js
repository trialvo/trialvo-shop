const { pool } = require('../config/db');

/**
 * Fulfillment pipeline for own-domain trials.
 *
 * After admin approval the customer downloads an installer (Docker for VPS,
 * Node-only for cPanel). `status` keeps its legacy meaning (pending / active /
 * rejected) for every existing query; `fulfillment_stage` is the finer-grained
 * progress marker layered on top.
 *
 *   received ─> deploying ─> live ─> expiring ─┬─> converted
 *                                              └─> expired
 *   (any pre-live stage) ─> rejected
 *   hosting_pending is retained so historical rows still validate.
 */
const STAGES = Object.freeze({
  RECEIVED: 'received',
  // Retained for legacy rows only — nothing assigns this stage any more.
  HOSTING_PENDING: 'hosting_pending',
  DEPLOYING: 'deploying',
  LIVE: 'live',
  EXPIRING: 'expiring',
  EXPIRED: 'expired',
  CONVERTED: 'converted',
  REJECTED: 'rejected',
});

const HOST_KINDS = Object.freeze(['vps', 'cpanel']);

/** Legal transitions. Anything not listed is refused so the queue can't be corrupted by a double click. */
const TRANSITIONS = Object.freeze({
  [STAGES.RECEIVED]: [STAGES.HOSTING_PENDING, STAGES.DEPLOYING, STAGES.REJECTED],
  [STAGES.HOSTING_PENDING]: [STAGES.DEPLOYING, STAGES.REJECTED],
  [STAGES.DEPLOYING]: [STAGES.LIVE, STAGES.REJECTED, STAGES.RECEIVED],
  [STAGES.LIVE]: [STAGES.EXPIRING, STAGES.EXPIRED, STAGES.CONVERTED],
  [STAGES.EXPIRING]: [STAGES.EXPIRED, STAGES.CONVERTED],
  [STAGES.EXPIRED]: [STAGES.CONVERTED],
  [STAGES.CONVERTED]: [],
  [STAGES.REJECTED]: [],
});

function canTransition(from, to) {
  if (!from) return true; // legacy rows without a stage
  return (TRANSITIONS[from] || []).includes(to);
}

function parseHistory(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Move a request to `stage`, appending to stage_history. Returns the updated row.
 * Throws with .status = 409 when the transition is not allowed.
 */
async function setStage(requestId, stage, { by = null, note = null, force = false } = {}) {
  const { rows } = await pool.query(
    'SELECT id, fulfillment_stage, stage_history FROM trial_requests WHERE id = $1',
    [requestId]
  );
  if (!rows.length) {
    const err = new Error('Trial request not found');
    err.status = 404;
    throw err;
  }
  const current = rows[0].fulfillment_stage || null;
  if (current === stage) return rows[0];
  if (!force && !canTransition(current, stage)) {
    const err = new Error(`Cannot move from ${current || 'none'} to ${stage}`);
    err.status = 409;
    throw err;
  }

  const history = parseHistory(rows[0].stage_history);
  history.push({ stage, at: new Date().toISOString(), by, note });

  const extra = [];
  if (stage === STAGES.DEPLOYING) extra.push('picked_up_at = COALESCE(picked_up_at, NOW())');
  if (stage === STAGES.LIVE) extra.push('fulfilled_at = NOW()');

  await pool.query(
    `UPDATE trial_requests
        SET fulfillment_stage = $1, stage_history = $2, updated_at = NOW()${extra.length ? ', ' + extra.join(', ') : ''}
      WHERE id = $3`,
    [stage, JSON.stringify(history), requestId]
  );

  const updated = await pool.query('SELECT * FROM trial_requests WHERE id = $1', [requestId]);
  return updated.rows[0];
}

/**
 * Validate the own-domain gate: customer must already have hosting, say
 * which kind, and give a usable domain. Buy-from-Trialvo is not a trial path.
 * Returns { ok, error, code, value } where value is the normalised subset to store.
 */
function validateHostingGate({ hostKind, hasHosting, desiredDomain }) {
  if (hasHosting !== true && hasHosting !== 1 && hasHosting !== 'true') {
    return { ok: false, code: 'HOSTING_CONFIRMATION_REQUIRED', error: 'Please confirm your domain and hosting are ready' };
  }
  const kind = String(hostKind || '').trim().toLowerCase();
  if (!HOST_KINDS.includes(kind)) {
    return { ok: false, code: 'HOST_KIND_REQUIRED', error: 'Select VPS or cPanel' };
  }
  const domain = normaliseDomain(desiredDomain);
  if (!domain) {
    return { ok: false, code: 'DOMAIN_REQUIRED', error: 'A valid domain is required for an own-domain trial' };
  }
  return { ok: true, value: { hostKind: kind, hasHosting: 1, desiredDomain: domain } };
}

/** Lowercase, strip scheme/path, basic RFC-ish check. Returns null when unusable. */
function normaliseDomain(raw) {
  if (!raw) return null;
  let d = String(raw).trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d)) return null;
  return d;
}

module.exports = {
  STAGES,
  HOST_KINDS,
  TRANSITIONS,
  canTransition,
  setStage,
  parseHistory,
  validateHostingGate,
  normaliseDomain,
};
