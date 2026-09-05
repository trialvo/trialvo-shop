/**
 * Split trial into two public paths:
 *   - Instant demo (trial_type = hosted): auto-provisioned, no approval.
 *   - Own-domain trial (trial_type = self_hosted): staff deploys manually on the
 *     customer's VPS/cPanel (or on hosting bought from Trialvo), 1-3 months.
 *
 * Adds the columns the domain path needs to track hosting, duration and the
 * manual fulfillment pipeline, plus the settings keys that drive the public UI.
 */
async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '026_trial_paths',
  async up(client) {
    // ── trial_requests: own-domain trial specifics ────────────────────────
    // Duration in months (1-3). requested_days stays as the derived value so
    // every existing query that reads days keeps working.
    await addColumnIfMissing(client, 'trial_requests', 'requested_months', 'INT NULL');
    // own | buy_from_trialvo — who supplies the server.
    await addColumnIfMissing(client, 'trial_requests', 'hosting_source', 'VARCHAR(24) NULL');
    // vps | cpanel — required when hosting_source = own; staff fills it for bought hosting.
    await addColumnIfMissing(client, 'trial_requests', 'host_kind', 'VARCHAR(16) NULL');
    // Customer confirmed "domain + hosting ready" (gate for the own path).
    await addColumnIfMissing(client, 'trial_requests', 'has_hosting', 'TINYINT(1) NOT NULL DEFAULT 0');
    // received | hosting_pending | deploying | live | expiring | expired | converted | rejected
    await addColumnIfMissing(client, 'trial_requests', 'fulfillment_stage', 'VARCHAR(24) NULL');
    // Append-only list of { stage, at, by, note } so the customer timeline and
    // admin audit both read from one place without joining instance_events.
    await addColumnIfMissing(client, 'trial_requests', 'stage_history', 'JSON NULL');
    // Demo request that led to this domain request (funnel + prefill + lead quality).
    await addColumnIfMissing(client, 'trial_requests', 'source_request_id', 'CHAR(36) NULL');
    await addColumnIfMissing(client, 'trial_requests', 'picked_up_at', 'DATETIME(3) NULL');
    await addColumnIfMissing(client, 'trial_requests', 'fulfilled_at', 'DATETIME(3) NULL');
    await addColumnIfMissing(client, 'trial_requests', 'staff_alerted_at', 'DATETIME(3) NULL');

    // assigned_admin_id was declared INT but admin_profiles.id is CHAR(36) — widen so
    // "Pick up" can actually store who owns the request.
    try {
      await client.query('ALTER TABLE trial_requests MODIFY COLUMN assigned_admin_id CHAR(36) NULL');
    } catch (e) {
      if (e.errno !== 1060) throw e;
    }

    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_stage ON trial_requests(fulfillment_stage)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_source ON trial_requests(source_request_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_type_status ON trial_requests(trial_type, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trial_req_ip_created ON trial_requests(ip_address, created_at)');

    // ── trial_instances: how the instance is operated ─────────────────────
    // shared  → ADMIN grant on the per-product demo stack (instant demo)
    // agent   → customer ran our installer; license agent reports heartbeats
    // manual  → staff deployed on customer server; no agent, cron must not
    //           enqueue remote commands for it.
    await addColumnIfMissing(client, 'trial_instances', 'provision_mode', 'VARCHAR(16) NULL');

    // ── settings ───────────────────────────────────────────────────────────
    const keys = [
      ['trial_demo_enabled', 'true', 'Instant demo path on/off (kill switch)'],
      ['trial_domain_enabled', 'true', 'Own-domain trial path on/off'],
      ['trial_domain_months', '1', 'Month presets customers may pick for own-domain trials (e.g. "1" or "1,2,3")'],
      ['trial_domain_default_months', '1', 'Preselected month preset'],
      ['trial_hosting_purchase_enabled', 'true', 'Allow "buy hosting from Trialvo" option'],
      ['trial_fulfillment_sla_hours', '24', 'Promised turnaround for staff-deployed trials (shown publicly)'],
      ['trial_demo_reset_enabled', 'false', 'Nightly shared-demo database reset from snapshot'],
      ['trial_demo_max_per_email_day', '3', 'Instant demo requests allowed per email per 24h'],
      ['trial_demo_max_per_ip_hour', '5', 'Instant demo requests allowed per IP per hour'],
    ];
    for (const [key, value, description] of keys) {
      await client.query(
        'INSERT IGNORE INTO system_config (`key`, value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    }

    // Instant demo is the product now: hosted requests always auto-provision.
    await client.query(
      "UPDATE system_config SET value = 'true', updated_at = NOW() WHERE `key` = 'trial_auto_approve_hosted'"
    );

    // Backfill: existing rows get a sensible stage so the new admin queue is not empty.
    await client.query(`
      UPDATE trial_requests
         SET fulfillment_stage = CASE
               WHEN status = 'rejected' THEN 'rejected'
               WHEN status = 'active' THEN 'live'
               ELSE 'received'
             END
       WHERE trial_type = 'self_hosted' AND fulfillment_stage IS NULL
    `);
    await client.query(`
      UPDATE trial_requests
         SET hosting_source = 'own', has_hosting = 1
       WHERE trial_type = 'self_hosted' AND hosting_source IS NULL
    `);

    console.log('✅ Migration 026: trial paths (months, hosting gate, fulfillment stage, provision_mode)');
  },
};
