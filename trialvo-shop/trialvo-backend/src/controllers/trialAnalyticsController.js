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

/**
 * GET /api/admin/trial-instances/funnel?days=30
 * demo requested → demo provisioned → own-domain requested → live → converted.
 * `linkedDomain` counts domain requests that reference a demo, i.e. the path we
 * actually market; `domainTotal` includes people who skipped the demo.
 */
async function getTrialFunnel(req, res, next) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const { rows } = await pool.query(
      `SELECT
         SUM(trial_type = 'hosted') AS demo_requested,
         SUM(trial_type = 'hosted' AND status = 'active') AS demo_provisioned,
         SUM(trial_type = 'self_hosted') AS domain_total,
         SUM(trial_type = 'self_hosted' AND source_request_id IS NOT NULL) AS domain_from_demo,
         SUM(trial_type = 'self_hosted' AND fulfillment_stage IN ('live','expiring','expired','converted')) AS domain_live,
         SUM(trial_type = 'self_hosted' AND fulfillment_stage = 'converted') AS domain_converted,
         SUM(trial_type = 'self_hosted' AND hosting_source = 'buy_from_trialvo') AS domain_buy_hosting,
         SUM(trial_type = 'self_hosted' AND host_kind = 'vps') AS domain_vps,
         SUM(trial_type = 'self_hosted' AND host_kind = 'cpanel') AS domain_cpanel,
         SUM(trial_type = 'self_hosted' AND status = 'pending'
             AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24) AS domain_overdue,
         AVG(CASE WHEN trial_type = 'self_hosted' AND fulfilled_at IS NOT NULL
                  THEN TIMESTAMPDIFF(HOUR, created_at, fulfilled_at) END) AS avg_fulfill_hours
       FROM trial_requests
       WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );
    const r = rows[0] || {};
    const n = (v) => Number(v || 0);
    const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

    const demoRequested = n(r.demo_requested);
    const demoProvisioned = n(r.demo_provisioned);
    const domainFromDemo = n(r.domain_from_demo);
    const domainLive = n(r.domain_live);
    const domainConverted = n(r.domain_converted);

    res.json({
      windowDays: days,
      steps: [
        { id: 'demo_requested', count: demoRequested },
        { id: 'demo_provisioned', count: demoProvisioned, pctOfPrev: pct(demoProvisioned, demoRequested) },
        { id: 'domain_requested', count: domainFromDemo, pctOfPrev: pct(domainFromDemo, demoProvisioned) },
        { id: 'domain_live', count: domainLive, pctOfPrev: pct(domainLive, n(r.domain_total)) },
        { id: 'converted', count: domainConverted, pctOfPrev: pct(domainConverted, domainLive) },
      ],
      domain: {
        total: n(r.domain_total),
        fromDemo: domainFromDemo,
        buyHosting: n(r.domain_buy_hosting),
        vps: n(r.domain_vps),
        cpanel: n(r.domain_cpanel),
        overdue: n(r.domain_overdue),
        avgFulfillHours: r.avg_fulfill_hours != null ? Math.round(Number(r.avg_fulfill_hours) * 10) / 10 : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTrialAnalytics, getTrialFunnel };
