// Coarse in-memory burst guard for the public trial endpoint.
//
// This is NOT the real quota. It only stops a single client hammering the
// route (scripts, retry loops). The meaningful limits — N demos per email per
// day, N per IP per hour — live in services/trialAbuseGuard and are DB-backed,
// so they count *created* requests rather than every HTTP attempt. Keeping this
// one generous means a human who mistypes their phone number three times is not
// locked out for an hour.
const buckets = new Map();

function trialRateLimit(max = 30, windowMs = 60 * 60 * 1000) {
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

        // Opportunistic cleanup so the map does not grow forever on a busy site.
        if (buckets.size > 5000) {
            for (const [key, value] of buckets) {
                if (now > value.reset) buckets.delete(key);
            }
        }

        if (entry.count > max) {
            return res.status(429).json({
                error: 'Too many trial requests. Try again later.',
                code: 'RATE_LIMITED',
                retryAfterSeconds: Math.max(1, Math.ceil((entry.reset - now) / 1000)),
            });
        }
        next();
    };
}

module.exports = { trialRateLimit };
