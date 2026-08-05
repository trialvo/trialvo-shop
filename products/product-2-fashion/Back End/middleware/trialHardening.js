/**
 * L-4.7 — Trial-mode CORS allowlist + global rate limit helpers.
 */
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function trialCors() {
  const raw = process.env.TRIAL_CORS_ORIGINS || '';
  if (process.env.TRIAL_MODE !== '1' || !raw.trim()) {
    // Non-trial / unset → permissive (existing Lifestyle default)
    return cors();
  }
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return cors({
    origin(origin, cb) {
      if (!origin || origins.includes(origin) || origins.includes('*')) return cb(null, true);
      return cb(new Error(`CORS blocked for origin ${origin}`));
    },
    credentials: true,
  });
}

function trialGlobalLimiter() {
  const windowMs = parseInt(process.env.TRIAL_RATE_WINDOW_MS || String(15 * 60 * 1000), 10);
  const max = parseInt(process.env.TRIAL_RATE_MAX || '600', 10);
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests', code: 'RATE_LIMIT' },
  });
}

module.exports = { trialCors, trialGlobalLimiter };
