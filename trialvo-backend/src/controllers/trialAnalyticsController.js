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
        SELECT status, COUNT(*) AS count
        FROM trial_instances
        GROUP BY status
      `),
      pool.query(`
        SELECT trial_type, COUNT(*) AS count
        FROM trial_instances
        GROUP BY trial_type
      `),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM trial_requests
        GROUP BY status
      `),
      pool.query(`
        SELECT COUNT(*) AS paid
        FROM trial_instances
        WHERE JSON_CONTAINS_PATH(meta, 'one', '$.paid_order_id')
      `),
      pool.query(`
        SELECT
          SUM(CASE
            WHEN last_heartbeat_at IS NOT NULL
              AND last_heartbeat_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
            THEN 1 ELSE 0 END) AS healthy,
          SUM(CASE
            WHEN status IN ('active', 'frozen', 'provisioning')
              AND (last_heartbeat_at IS NULL OR last_heartbeat_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
            THEN 1 ELSE 0 END) AS stale,
          SUM(CASE
            WHEN status IN ('active', 'frozen', 'provisioning')
            THEN 1 ELSE 0 END) AS monitored
        FROM trial_instances
      `),
      pool.query(`
        SELECT COUNT(*) AS count
        FROM trial_instances
        WHERE JSON_UNQUOTE(JSON_EXTRACT(meta, '$.agent_outdated')) IN ('true', '1')
          AND status NOT IN ('destroyed')
      `),
      pool.query(`
        SELECT COUNT(*) AS count
        FROM trial_instances
        WHERE status = 'active'
          AND expires_at IS NOT NULL
          AND expires_at > NOW()
          AND expires_at <= DATE_ADD(NOW(), INTERVAL 3 DAY)
      `),
    ]);

    const statusMap = Object.fromEntries(byStatus.rows.map((r) => [r.status, Number(r.count)]));
    const typeMap = Object.fromEntries(byType.rows.map((r) => [r.trial_type, Number(r.count)]));
    const requestMap = Object.fromEntries(requests.rows.map((r) => [r.status, Number(r.count)]));

    const totalInstances = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const active = statusMap.active || 0;
    const frozen = statusMap.frozen || 0;
    const expired = statusMap.expired || 0;
    const destroyed = statusMap.destroyed || 0;
    const paid = Number(conversions.rows[0]?.paid || 0);
    const approvedRequests = (requestMap.active || 0) + (requestMap.rejected || 0);
    const conversionRate = approvedRequests > 0
      ? Math.round((paid / Math.max(totalInstances, 1)) * 1000) / 10
      : 0;

    const hb = heartbeat.rows[0] || { healthy: 0, stale: 0, monitored: 0 };
    const healthy = Number(hb.healthy || 0);
    const stale = Number(hb.stale || 0);
    const monitored = Number(hb.monitored || 0);
    const uptimePct = monitored > 0
      ? Math.round((healthy / monitored) * 1000) / 10
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
        healthyHeartbeats: healthy,
        staleInstances: stale,
        monitored,
        healthyPct: uptimePct,
      },
      alerts: {
        expiringSoon: Number(expiringSoon.rows[0]?.count || 0),
        outdatedAgents: Number(outdated.rows[0]?.count || 0),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTrialAnalytics };
