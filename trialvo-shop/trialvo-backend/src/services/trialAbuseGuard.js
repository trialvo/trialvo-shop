const { pool } = require('../config/db');

/**
 * Abuse controls for the public trial form.
 *
 * Instant demo hands out ADMIN logins with no human approval, so the form
 * needs more than the in-memory IP limiter (which resets on every deploy and
 * is trivially bypassed with a VPN). Everything here is DB-backed and cheap:
 * one COUNT per check against indexed columns.
 */

// Well-known throwaway mail providers. Extend via TRIAL_DISPOSABLE_DOMAINS="a.com,b.net".
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net',
  'mailinator.com', 'maildrop.cc', 'yopmail.com', 'yopmail.fr', 'temp-mail.org',
  'tempmail.com', 'tempmail.net', 'tempmailo.com', 'throwawaymail.com', 'trashmail.com',
  'getnada.com', 'sharklasers.com', 'dispostable.com', 'fakeinbox.com', 'mohmal.com',
  'emailondeck.com', 'mintemail.com', 'mytemp.email', 'tmpmail.org', 'tmpmail.net',
  'burnermail.io', 'moakt.com', 'inboxkitten.com', 'tempr.email', 'discard.email',
  ...String(process.env.TRIAL_DISPOSABLE_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
]);

function emailDomain(email) {
  const at = String(email || '').lastIndexOf('@');
  return at === -1 ? '' : String(email).slice(at + 1).trim().toLowerCase();
}

function isDisposableEmail(email) {
  return DISPOSABLE_DOMAINS.has(emailDomain(email));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

/**
 * Honeypot: the form renders a visually hidden `website` field humans never
 * fill. Bots that auto-complete every input give themselves away.
 */
function honeypotTripped(body) {
  const v = String(body?.website ?? body?.hp ?? body?.company_url ?? '').trim();
  if (!v) return false;
  // Chrome / password-managers dump the login email into a hidden
  // "website" field. That is not a bot — ignore values that look like
  // the same email the human just typed.
  const email = String(body?.email || '').trim().toLowerCase();
  if (email && v.toLowerCase() === email) return false;
  if (v.includes('@') && !/^https?:\/\//i.test(v)) return false;
  return true;
}

async function countRecent({ column, value, windowSql }) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS n FROM trial_requests
      WHERE ${column} = $1 AND created_at > ${windowSql}`,
    [value]
  );
  return Number(rows[0]?.n || 0);
}

/**
 * Returns { ok:true } or { ok:false, code, error, retryAfterSeconds }.
 * Limits come from settings so the admin can loosen them during a campaign.
 */
async function checkRateLimits({ ip, email, settings }) {
  const perIpHour = settings?.demoMaxPerIpHour ?? 5;
  const perEmailDay = settings?.demoMaxPerEmailDay ?? 3;

  if (ip) {
    const n = await countRecent({ column: 'ip_address', value: ip, windowSql: 'DATE_SUB(NOW(), INTERVAL 1 HOUR)' });
    if (n >= perIpHour) {
      return { ok: false, code: 'RATE_LIMIT_IP', error: 'Too many requests from this network. Try again in an hour.', retryAfterSeconds: 3600 };
    }
  }
  if (email) {
    const n = await countRecent({ column: 'email', value: email, windowSql: 'DATE_SUB(NOW(), INTERVAL 1 DAY)' });
    if (n >= perEmailDay) {
      return { ok: false, code: 'RATE_LIMIT_EMAIL', error: 'This email has reached today\'s trial limit. Use your existing access link or try tomorrow.', retryAfterSeconds: 86400 };
    }
  }
  return { ok: true };
}

module.exports = {
  isDisposableEmail,
  isValidEmail,
  honeypotTripped,
  checkRateLimits,
  emailDomain,
};
