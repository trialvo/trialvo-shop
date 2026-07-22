const { pool } = require('../config/db');

/**
 * GET /api/admin/trial-analytics
 * Active trials, conversion, heartbeat uptime signals.
 */
async function getTrialAnalytics(req, res, next) {
  try {
    const [
      byStatus,
      byType,
      requests,
      conversions,
      heartbeat,
      outdated,
      expiringSoon,
    ] = await Promise.all([
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM trial_instances
        GROUP BY status
      `),
      pool.query(`
        SELECT trial_type, COUNT(*)::int AS count
        FROM trial_instances
        GROUP BY trial_type
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM trial_requests
        GROUP BY status
      `),
      pool.query(`
        SELECT COUNT(*)::int AS paid
        FROM trial_instances
        WHERE meta ? 'paid_order_id'
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE last_heartbeat_at IS NOT NULL
              AND last_heartbeat_at > NOW() - INTERVAL '30 minutes'
          )::int AS healthy,
          COUNT(*) FILTER (
            WHERE status IN ('active', 'frozen', 'provisioning')
              AND (last_heartbeat_at IS NULL OR last_heartbeat_at <= NOW() - INTERVAL '30 minutes')
          )::int AS stale,
          COUNT(*) FILTER (
            WHERE status IN ('active', 'frozen', 'provisioning')
          )::int AS monitored
        FROM trial_instances
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM trial_instances
        WHERE COALESCE((meta->>'agent_outdated')::boolean, false) = true
          AND status NOT IN ('destroyed')
      `),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM trial_instances
        WHERE status = 'active'
          AND expires_at IS NOT NULL
          AND expires_at > NOW()
          AND expires_at <= NOW() + INTERVAL '3 days'
      `),
    ]);

    const statusMap = Object.fromEntries(byStatus.rows.map((r) => [r.status, r.count]));
    const typeMap = Object.fromEntries(byType.rows.map((r) => [r.trial_type, r.count]));
    const requestMap = Object.fromEntries(requests.rows.map((r) => [r.status, r.count]));

    const totalInstances = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const active = statusMap.active || 0;
    const frozen = statusMap.frozen || 0;
    const expired = statusMap.expired || 0;
    const destroyed = statusMap.destroyed || 0;
    const paid = conversions.rows[0]?.paid || 0;
    const approvedRequests = (requestMap.active || 0) + (requestMap.rejected || 0);
    const conversionRate = approvedRequests > 0
      ? Math.round((paid / Math.max(totalInstances, 1)) * 1000) / 10
      : 0;

    const hb = heartbeat.rows[0] || { healthy: 0, stale: 0, monitored: 0 };
    const uptimePct = hb.monitored > 0
      ? Math.round((hb.healthy / hb.monitored) * 1000) / 10
      : null;

    res.json({
      instances: {
        total: totalInstances,
        active,
        frozen,
        expired,
        destroyed,
        provisioning: statusMap.provisioning || 0,
        byStatus: statusMap,
        byType: typeMap,
      },
      requests: {
        pending: requestMap.pending || 0,
        active: requestMap.active || 0,
        rejected: requestMap.rejected || 0,
        byStatus: requestMap,
      },
      conversion: {
        paidConversions: paid,
        conversionRatePct: conversionRate,
      },
      uptime: {
        healthyHeartbeats: hb.healthy,
        staleInstances: hb.stale,
        monitored: hb.monitored,
        healthyPct: uptimePct,
      },
      alerts: {
        expiringSoon: expiringSoon.rows[0]?.count || 0,
        outdatedAgents: outdated.rows[0]?.count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTrialAnalytics };
