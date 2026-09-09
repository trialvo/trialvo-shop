const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

/**
 * One-time email codes that sit in front of createTrialRequest.
 *
 * Instant demo (and the dedupe branch) can hand back an existing admin
 * password, so an unverified caller must never reach that endpoint. Codes
 * are stored as HMACs so a leaked DB row is not a usable OTP.
 */

const VERIFICATION_TTL_MINUTES = 10;
const TOKEN_TTL_MINUTES = 30;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_EMAIL_HOUR = 5;
const MAX_CODES_PER_IP_HOUR = 15;
const MAX_ATTEMPTS = 5;

const SECRET = process.env.TRIAL_VERIFY_SECRET || process.env.JWT_SECRET;

function normaliseEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashCode(email, code) {
  return crypto.createHmac('sha256', SECRET).update(`${email}:${code}`).digest('hex');
}

async function startVerification({ email, ip, purpose = 'trial' }) {
  const normalised = normaliseEmail(email);

  await pool.query(
    'DELETE FROM trial_email_verifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)'
  );

  const newest = await pool.query(
    `SELECT id, created_at FROM trial_email_verifications
      WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [normalised]
  );
  if (newest.rows.length) {
    const ageSec = (Date.now() - new Date(newest.rows[0].created_at).getTime()) / 1000;
    if (ageSec < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        code: 'VERIFY_COOLDOWN',
        error: 'Please wait a moment before requesting another code.',
        retryAfterSeconds: Math.max(1, Math.ceil(RESEND_COOLDOWN_SECONDS - ageSec)),
      };
    }
  }

  const hourly = await pool.query(
    `SELECT COUNT(*) AS n FROM trial_email_verifications
      WHERE email = $1 AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [normalised]
  );
  if (Number(hourly.rows[0]?.n || 0) >= MAX_CODES_PER_EMAIL_HOUR) {
    return {
      ok: false,
      code: 'VERIFY_RATE_LIMIT',
      error: 'Too many codes sent to this email. Try again in an hour.',
      retryAfterSeconds: 3600,
    };
  }

  if (ip) {
    const ipHourly = await pool.query(
      `SELECT COUNT(*) AS n FROM trial_email_verifications
        WHERE ip_address = $1 AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [ip]
    );
    if (Number(ipHourly.rows[0]?.n || 0) >= MAX_CODES_PER_IP_HOUR) {
      return {
        ok: false,
        code: 'VERIFY_RATE_LIMIT_IP',
        error: 'Too many codes requested from this network. Try again in an hour.',
        retryAfterSeconds: 3600,
      };
    }
  }

  // Only the newest code may succeed; older unused rows would otherwise
  // stay valid until their own TTL and invite guessing against leftovers.
  await pool.query(
    `UPDATE trial_email_verifications
        SET consumed_at = NOW(3)
      WHERE email = $1 AND consumed_at IS NULL`,
    [normalised]
  );

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const id = uuidv4();
  await pool.query(
    `INSERT INTO trial_email_verifications
       (id, email, code_hash, purpose, attempts, expires_at, consumed_at, ip_address)
     VALUES ($1, $2, $3, $4, 0, DATE_ADD(NOW(3), INTERVAL ${VERIFICATION_TTL_MINUTES} MINUTE), NULL, $5)`,
    [id, normalised, hashCode(normalised, code), purpose, ip || null]
  );

  // Plaintext `code` is only for the controller to put in the email — it
  // must never be copied into an HTTP response body.
  return {
    ok: true,
    code,
    expiresInSeconds: VERIFICATION_TTL_MINUTES * 60,
    resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
  };
}

async function confirmVerification({ email, code }) {
  const normalised = normaliseEmail(email);
  const { rows } = await pool.query(
    `SELECT id, code_hash, attempts FROM trial_email_verifications
      WHERE email = $1 AND consumed_at IS NULL AND expires_at > NOW(3)
      ORDER BY created_at DESC LIMIT 1`,
    [normalised]
  );
  const row = rows[0];
  if (!row) {
    return {
      ok: false,
      code: 'VERIFY_CODE_EXPIRED',
      error: 'That code has expired. Request a new one.',
    };
  }

  if (Number(row.attempts) >= MAX_ATTEMPTS) {
    await pool.query(
      'UPDATE trial_email_verifications SET consumed_at = NOW(3) WHERE id = $1',
      [row.id]
    );
    return {
      ok: false,
      code: 'VERIFY_TOO_MANY_ATTEMPTS',
      error: 'Too many incorrect attempts. Request a new code.',
    };
  }

  const expected = hashCode(normalised, String(code || '').trim());
  const a = Buffer.from(String(row.code_hash));
  const b = Buffer.from(expected);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) {
    const nextAttempts = Number(row.attempts) + 1;
    await pool.query(
      'UPDATE trial_email_verifications SET attempts = $1 WHERE id = $2',
      [nextAttempts, row.id]
    );
    return {
      ok: false,
      code: 'VERIFY_CODE_INVALID',
      error: 'That code is incorrect.',
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - nextAttempts),
    };
  }

  await pool.query(
    'UPDATE trial_email_verifications SET consumed_at = NOW(3) WHERE id = $1',
    [row.id]
  );
  return {
    ok: true,
    token: issueVerificationToken(normalised),
    expiresInSeconds: TOKEN_TTL_MINUTES * 60,
  };
}

function issueVerificationToken(email) {
  const payload = Buffer.from(JSON.stringify({
    email: normaliseEmail(email),
    exp: Date.now() + TOKEN_TTL_MINUTES * 60000,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyVerificationToken(token, email) {
  try {
    const raw = String(token || '');
    const parts = raw.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    const [payload, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.exp !== 'number' || data.exp <= Date.now()) return false;
    return data.email === normaliseEmail(email);
  } catch {
    return false;
  }
}

module.exports = {
  startVerification,
  confirmVerification,
  issueVerificationToken,
  verifyVerificationToken,
};
