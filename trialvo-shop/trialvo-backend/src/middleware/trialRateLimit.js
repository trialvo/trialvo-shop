// Simple in-memory rate limiter for public trial form (5 req/hour per IP).
const buckets = new Map();

function trialRateLimit(max = 5, windowMs = 60 * 60 * 1000) {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
        const now = Date.now();
        const entry = buckets.get(ip) || { count: 0, reset: now + windowMs };
        if (now > entry.reset) {
            entry.count = 0;
            entry.reset = now + windowMs;
        }
        entry.count += 1;
        buckets.set(ip, entry);
        if (entry.count > max) {
            return res.status(429).json({ error: 'Too many trial requests. Try again later.' });
        }
        next();
    };
}

module.exports = { trialRateLimit };
