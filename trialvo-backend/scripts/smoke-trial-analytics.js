/**
 * Smoke TS-6.3 / 6.4 / 6.5: analytics query + events prune + agent version helper.
 */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { pruneInstanceEvents } = require('../src/cron/eventsRetention');
const { isAgentOutdated, CURRENT_AGENT_VERSION } = require('../src/services/agentVersion');
const { getTrialAnalytics } = require('../src/controllers/trialAnalyticsController');

(async () => {
  // Fake express-ish call for analytics
  let payload = null;
  await getTrialAnalytics(
    {},
    { json: (body) => { payload = body; } },
    (err) => { throw err; }
  );

  console.log('analytics.active=', payload.instances.active);
  console.log('analytics.conversion=', payload.conversion);
  console.log('analytics.uptime=', payload.uptime);
  console.log('requiredAgentVersion=', CURRENT_AGENT_VERSION);
  console.log('outdated(old)=', isAgentOutdated('node-embedded-1.0'));
  console.log('outdated(current)=', isAgentOutdated(CURRENT_AGENT_VERSION));

  // Retention dry-run (won't delete recent smoke rows unless >90d)
  const pruned = await pruneInstanceEvents();
  console.log('prunedEvents=', pruned);

  const ok = payload
    && typeof payload.instances.total === 'number'
    && isAgentOutdated('node-embedded-1.0') === true
    && isAgentOutdated(CURRENT_AGENT_VERSION) === false;

  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
