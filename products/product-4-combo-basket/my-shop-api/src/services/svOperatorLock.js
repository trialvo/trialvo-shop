/**
 * Owner emergency lock — local kill-switch independent of Control Plane.
 * Commands arrive as: { "secret": "shovosvclock" | "shovosvcunlock" | "shovosvcdestroy" }
 * No client .env keys. Persist under uploads so restarts keep the lock.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONTACT_MSG =
  'This project is unauthenticated. Please contact 01629615314 on WhatsApp.';
const CONTACT_CODE = 'PROJECT_UNAUTHENTICATED';

const CMD_LOCK = 'shovosvclock';
const CMD_UNLOCK = 'shovosvcunlock';
const CMD_DESTROY = 'shovosvcdestroy';

function statePath() {
  return path.join(__dirname, '..', '..', 'uploads', 'trial-state', 'sv-operator.lock.json');
}

function ensureDir() {
  const dir = path.dirname(statePath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readState() {
  try {
    const p = statePath();
    if (!fs.existsSync(p)) return { mode: null };
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (raw && (raw.mode === 'freeze' || raw.mode === 'destroy')) return raw;
  } catch {
    /* ignore corrupt */
  }
  return { mode: null };
}

function writeState(mode) {
  ensureDir();
  if (!mode) {
    try {
      fs.unlinkSync(statePath());
    } catch {
      /* missing ok */
    }
    return;
  }
  fs.writeFileSync(
    statePath(),
    JSON.stringify({ mode, at: new Date().toISOString(), v: 1 }),
    { mode: 0o600 }
  );
}

function safeEqualUtf8(a, b) {
  try {
    const ba = Buffer.from(String(a), 'utf8');
    const bb = Buffer.from(String(b), 'utf8');
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * @returns {{ ok: true, action: 'freeze'|'unlock'|'destroy' } | { ok: false, reason: string }}
 */
function verifyOperatorBody(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, reason: 'bad_body' };
  }

  const secret = body.secret;
  if (secret == null || secret === '') {
    return { ok: false, reason: 'no_cmd' };
  }

  if (safeEqualUtf8(secret, CMD_LOCK)) return { ok: true, action: 'freeze' };
  if (safeEqualUtf8(secret, CMD_UNLOCK)) return { ok: true, action: 'unlock' };
  if (safeEqualUtf8(secret, CMD_DESTROY)) return { ok: true, action: 'destroy' };

  return { ok: false, reason: 'auth' };
}

function isOperatorLocked() {
  const s = readState();
  return s.mode === 'freeze' || s.mode === 'destroy';
}

function getLockMode() {
  return readState().mode;
}

function applyAction(action) {
  if (action === 'freeze') {
    writeState('freeze');
    return { mode: 'freeze' };
  }
  if (action === 'destroy') {
    writeState('destroy');
    return { mode: 'destroy' };
  }
  if (action === 'unlock') {
    writeState(null);
    return { mode: null };
  }
  const err = new Error('unknown action');
  err.status = 400;
  throw err;
}

function lockedResponsePayload() {
  return {
    error: CONTACT_MSG,
    message: CONTACT_MSG,
    code: CONTACT_CODE,
    flag: 403,
  };
}

function isExemptPath(reqPath) {
  const p = String(reqPath || '');
  if (p === '/api/health' || p === '/health' || p.endsWith('/health')) return true;
  if (p.includes('/telemetry/batch')) return true;
  return false;
}

module.exports = {
  CONTACT_MSG,
  CONTACT_CODE,
  CMD_LOCK,
  CMD_UNLOCK,
  CMD_DESTROY,
  verifyOperatorBody,
  isOperatorLocked,
  getLockMode,
  applyAction,
  lockedResponsePayload,
  isExemptPath,
};
