const { isTrialLocked } = require('../services/licenseClient');
const {
  isOperatorLocked,
  lockedResponsePayload,
} = require('../services/svOperatorLock');

/**
 * Blocks API when trial/paid license is invalid or instance is frozen remotely.
 * Active when TRIAL_MODE=1 or LICENSE_ENFORCE=1 (paid Docker / cPanel packs).
 * Supports optional Go agent gate (AGENT_GATE_URL) + grace (D6).
 * Owner emergency lock (svOperator) always takes precedence when active.
 */
function licenseGuard(req, res, next) {
    if (isOperatorLocked()) {
        const openPaths = ['/api/health', '/health'];
        const isOpen = openPaths.some((p) => req.path === p || req.path.endsWith(p));
        const isCmd = String(req.path || '').includes('/telemetry/batch')
          || String(req.originalUrl || '').includes('/telemetry/batch');
        if (!isOpen && !isCmd) {
            return res.status(403).json(lockedResponsePayload());
        }
    }

    const trial = process.env.TRIAL_MODE === '1';
    const enforce =
        process.env.LICENSE_ENFORCE === '1' || process.env.LICENSE_ENFORCE === 'true';
    if (!trial && !enforce) return next();

    const openPaths = ['/api/health', '/health'];
    if (openPaths.some((p) => req.path === p || req.path.endsWith(p))) return next();

    Promise.resolve()
        .then(async () => {
            if (await isTrialLocked()) {
                return res.status(403).json({
                    error: trial
                        ? 'Trial period ended or instance frozen. Contact Trialvo to renew.'
                        : 'License inactive or instance frozen. Contact Trialvo support.',
                    code: trial ? 'TRIAL_LOCKED' : 'LICENSE_LOCKED',
                });
            }
            return next();
        })
        .catch(next);
}

module.exports = licenseGuard;