const CURRENT_AGENT_VERSION = process.env.CURRENT_AGENT_VERSION || 'node-embedded-1.3';

/**
 * Semver-ish / dotted compare for our agent tags like node-embedded-1.1
 * Returns true if current is older than required.
 */
function isAgentOutdated(current, required = CURRENT_AGENT_VERSION) {
  if (!current) return true;
  const curNums = String(current).match(/(\d+)/g)?.map(Number) || [];
  const reqNums = String(required).match(/(\d+)/g)?.map(Number) || [];
  const len = Math.max(curNums.length, reqNums.length);
  for (let i = 0; i < len; i += 1) {
    const a = curNums[i] || 0;
    const b = reqNums[i] || 0;
    if (a < b) return true;
    if (a > b) return false;
  }
  return false;
}

module.exports = { CURRENT_AGENT_VERSION, isAgentOutdated };
