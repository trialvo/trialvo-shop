const { pool } = require('../config/db');

const RETENTION_DAYS = parseInt(process.env.INSTANCE_EVENTS_RETENTION_DAYS || '90', 10);

async function pruneInstanceEvents() {
  const days = Number.isFinite(RETENTION_DAYS) && RETENTION_DAYS > 0 ? RETENTION_DAYS : 90;
  const { rowCount } = await pool.query(
    `DELETE FROM instance_events
     WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  if (rowCount) {
    console.log(`[eventsRetention] Pruned ${rowCount} event(s) older than ${days}d`);
  }
  return rowCount || 0;
}

function startEventsRetentionCron() {
  const cron = require('node-cron');
  // Daily at 03:15
  cron.schedule('15 3 * * *', () => {
    pruneInstanceEvents().catch((e) => console.error('[eventsRetention]', e.message));
  });
  console.log(`[eventsRetention] Daily prune scheduled (keep ${RETENTION_DAYS}d)`);
}

module.exports = { pruneInstanceEvents, startEventsRetentionCron, RETENTION_DAYS };
