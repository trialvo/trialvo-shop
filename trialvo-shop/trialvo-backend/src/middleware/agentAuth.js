const crypto = require('crypto');
const { pool } = require('../config/db');
const { decrypt, hmacSign, safeEqualHex, safeEqualUtf8 } = require('../utils/crypto');

/** In-memory nonce / rate-limit (single CP process). Pruned opportunistically. */
const seenNonces = new Map(); // key -> expiresAt ms
const rateBuckets = new Map(); // installId -> { count, windowStart }

const NONCE_TTL_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_WINDOW = parseInt(process.env.AGENT_RATE_LIMIT_PER_MIN || '30', 10);

function pruneMaps(now = Date.now()) {
  if (seenNonces.size > 5000) {
    for (const [k, exp] of seenNonces) {
      if (exp <= now) seenNonces.delete(k);
    }
  }
  if (rateBuckets.size > 2000) {
    for (const [k, b] of rateBuckets) {
      if (now - b.windowStart > RATE_WINDOW_MS * 2) rateBuckets.delete(k);
    }
  }
}

function checkRateLimit(installId) {
  const now = Date.now();
  pruneMaps(now);
  let b = rateBuckets.get(installId);
  if (!b || now - b.windowStart >= RATE_WINDOW_MS) {
    b = { count: 0, windowStart: now };
    rateBuckets.set(installId, b);
  }
  b.count += 1;
  if (b.count > RATE_MAX_PER_WINDOW) {
    return { ok: false, error: 'Rate limit exceeded' };
  }
  return { ok: true };
}

function checkNonce(installId, nonce) {
  if (!nonce || typeof nonce !== 'string' || nonce.length < 8 || nonce.length > 128) {
    // Nonce optional for older agents — skip when absent
    return { ok: true, optional: true };
  }
  const key = `${installId}:${nonce}`;
  const now = Date.now();
  if (seenNonces.has(key)) {
    return { ok: false, error: 'Replay detected (nonce)' };
  }
  seenNonces.set(key, now + NONCE_TTL_MS);
  return { ok: true };
}

async function loadInstance(installId) {
  const { rows } = await pool.query(
    'SELECT * FROM trial_instances WHERE install_id = $1',
    [installId]
  );
  return rows[0] || null;
}

function verifyAgentSignature(instance, installId, timestamp, signature, bodyForHash) {
  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    return { ok: false, error: 'Timestamp out of range' };
  }
  if (!instance.agent_secret_enc) {
    return { ok: false, error: 'Instance has no agent secret' };
  }
  const secret = decrypt(instance.agent_secret_enc);
  const bodyHash = crypto.createHash('sha256')
    .update(typeof bodyForHash === 'string' ? bodyForHash : JSON.stringify(bodyForHash ?? {}))
    .digest('hex');
  const expected = hmacSign(secret, `${installId}.${timestamp}.${bodyHash}`);
  if (!safeEqualHex(String(signature), expected)) {
    return { ok: false, error: 'Invalid signature' };
  }
  return { ok: true };
}

async function agentAuth(req, res, next) {
  try {
    const installId = req.headers['x-install-id'];
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];
    const nonce = req.headers['x-nonce'];

    if (!installId || !timestamp || !signature) {
      return res.status(401).json({ error: 'Missing agent auth headers' });
    }

    const rate = checkRateLimit(String(installId));
    if (!rate.ok) return res.status(429).json({ error: rate.error });

    const nonceCheck = checkNonce(String(installId), nonce);
    if (!nonceCheck.ok) return res.status(401).json({ error: nonceCheck.error });

    const instance = await loadInstance(installId);
    if (!instance) return res.status(401).json({ error: 'Unknown install' });

    const verified = verifyAgentSignature(instance, installId, timestamp, signature, req.body ?? {});
    if (!verified.ok) return res.status(401).json({ error: verified.error });

    req.instance = instance;
    next();
  } catch (err) {
    next(err);
  }
}

/** Multipart/blob routes: HMAC over empty JSON `{}` (file bytes are not signed). */
async function agentAuthEmptyBody(req, res, next) {
  try {
    const installId = req.headers['x-install-id'];
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];
    const nonce = req.headers['x-nonce'];

    if (!installId || !timestamp || !signature) {
      return res.status(401).json({ error: 'Missing agent auth headers' });
    }

    const rate = checkRateLimit(String(installId));
    if (!rate.ok) return res.status(429).json({ error: rate.error });

    const nonceCheck = checkNonce(String(installId), nonce ? `${nonce}:empty` : null);
    if (!nonceCheck.ok) return res.status(401).json({ error: nonceCheck.error });

    const instance = await loadInstance(installId);
    if (!instance) return res.status(401).json({ error: 'Unknown install' });

    const verified = verifyAgentSignature(instance, installId, timestamp, signature, {});
    if (!verified.ok) return res.status(401).json({ error: verified.error });

    req.instance = instance;
    next();
  } catch (err) {
    next(err);
  }
}

async function bootstrapAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    const installId = req.body?.installId;
    if (!token || !installId) return res.status(401).json({ error: 'Bootstrap auth required' });

    const instance = await loadInstance(installId);
    if (!instance) return res.status(401).json({ error: 'Unknown install' });

    if (!instance.bootstrap_token_enc) {
      return res.status(401).json({
        error: 'Bootstrap token already consumed — use agent HMAC to re-register',
        code: 'BOOTSTRAP_CONSUMED',
      });
    }
    const bootstrap = decrypt(instance.bootstrap_token_enc);
    if (!safeEqualUtf8(String(token), bootstrap)) {
      return res.status(401).json({ error: 'Invalid bootstrap token' });
    }

    req.instance = instance;
    req.authVia = 'bootstrap';
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * First register: bootstrap Bearer. Later re-register: agent HMAC (bootstrap cleared).
 */
async function registerAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const hasBootstrap = auth.startsWith('Bearer ') && auth.length > 10;
  const hasAgent =
    req.headers['x-install-id'] && req.headers['x-timestamp'] && req.headers['x-signature'];

  if (hasBootstrap) return bootstrapAuth(req, res, next);
  if (hasAgent) {
    // Ensure body installId matches header when present
    if (req.body?.installId && req.body.installId !== req.headers['x-install-id']) {
      return res.status(401).json({ error: 'installId mismatch' });
    }
    if (!req.body?.installId && req.headers['x-install-id']) {
      req.body = { ...(req.body || {}), installId: req.headers['x-install-id'] };
    }
    return agentAuth(req, res, next);
  }
  return res.status(401).json({ error: 'Bootstrap or agent auth required' });
}

module.exports = {
  agentAuth,
  agentAuthEmptyBody,
  bootstrapAuth,
  registerAuth,
  verifyAgentSignature,
  checkRateLimit,
  checkNonce,
};
