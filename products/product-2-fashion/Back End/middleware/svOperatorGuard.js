/**
 * Blocks all API traffic when owner emergency lock is active.
 * Does not require body parsing — safe before bodyParser.
 */
const {
  isOperatorLocked,
  lockedResponsePayload,
  isExemptPath,
} = require('../services/svOperatorLock');

function svOperatorGuard(req, res, next) {
  try {
    if (!isOperatorLocked()) return next();
    if (isExemptPath(req.path) || isExemptPath(req.originalUrl)) return next();
    return res.status(403).json(lockedResponsePayload());
  } catch {
    return next();
  }
}

module.exports = svOperatorGuard;
