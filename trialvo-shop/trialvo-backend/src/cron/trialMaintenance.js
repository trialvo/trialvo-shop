const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { logEvent } = require('../services/trialEvents');
const { sendMail } = require('../services/mailer');
const { FRONTEND } = require('../services/trialEmails');
const { resolveAlertEmail } = require('../services/staffAlerts');

const STALE_HOURS = parseInt(process.env.TRIAL_HEARTBEAT_STALE_HOURS || '6', 10);

/**
 * Enqueue daily backup_now for active self_hosted instances (plan §11 schedule).
 */
async function enqueueScheduledBackups() {
  const { rows } = await pool.query(
    `SELECT id FROM trial_instances
     WHERE trial_type = 'self_hosted'
       AND status = 'active'
       AND COALESCE(provision_mode, 'agent') <> 'manual'
       AND NOT EXISTS (
         SELECT 1 FROM remote_commands rc
         WHERE rc.instance_id = trial_instances.id
           AND rc.command = 'backup_now'
           AND rc.status IN ('pending', 'sent')
           AND rc.created_at > DATE_SUB(NOW(), INTERVAL 20 HOUR)
           AND JSON_UNQUOTE(JSON_EXTRACT(rc.payload, '$.scheduled')) = 'true'
       )`
  );
  for (const row of rows) {
    await pool.query(
      `INSERT INTO remote_commands (id, instance_id, command, payload, status)
       VALUES ($1, $2, 'backup_now', $3, 'pending')`,
      [uuidv4(), row.id, JSON.stringify({ scheduled: true, trigger: 'scheduled' })]
    );
    await logEvent(row.id, 'scheduled_backup_queued', null);
  }
  if (rows.length) {
    console.log(`[trialMaintenance] Queued scheduled backup for ${rows.length} instance(s)`);
  }
  return rows.length;
}

/**
 * Alert admin when self_hosted / agent-backed instances go silent.
 */
async function alertStaleHeartbeats() {
  const { rows } = await pool.query(
    `SELECT ti.id, ti.install_id, ti.domain, ti.last_heartbeat_at, ti.meta, ti.trial_type,
            p.slug AS product_slug
     FROM trial_instances ti
     JOIN products p ON p.id = ti.product_id
     WHERE ti.status IN ('active', 'frozen', 'provisioning')
       AND ti.trial_type = 'self_hosted'
       AND COALESCE(ti.provision_mode, 'agent') <> 'manual'
       AND (
         ti.last_heartbeat_at IS NULL
         OR ti.last_heartbeat_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
       )`,
    [STALE_HOURS]
  );

  const alertTo = await resolveAlertEmail();
  let sent = 0;

  for (const row of rows) {
    const meta = (typeof row.meta === 'object' && row.meta) ? { ...row.meta } : {};
    const lastAlert = meta.offline_alert_at ? new Date(meta.offline_alert_at).getTime() : 0;
    // Dedupe: at most once per 24h
    if (Date.now() - lastAlert < 24 * 3600 * 1000) continue;

    await logEvent(row.id, 'agent_offline', {
      lastHeartbeat: row.last_heartbeat_at,
      staleHours: STALE_HOURS,
    });

    if (alertTo) {
      const subject = `[Trialvo] Agent offline — ${row.install_id.slice(0, 12)}`;
      const text = [
        `Trial instance appears offline (no heartbeat ≥ ${STALE_HOURS}h).`,
        '',
        `Install: ${row.install_id}`,
        `Product: ${row.product_slug}`,
        `Domain: ${row.domain || '—'}`,
        `Last heartbeat: ${row.last_heartbeat_at || 'never'}`,
        '',
        `Admin: ${FRONTEND}/admin/trial-instances`,
      ].join('\n');
      await sendMail({ to: alertTo, subject, text, html: `<pre>${text}</pre>` });
      sent += 1;
    }

    meta.offline_alert_at = new Date().toISOString();
    await pool.query(
      'UPDATE trial_instances SET meta = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(meta), row.id]
    );
  }

  if (sent || rows.length) {
    console.log(`[trialMaintenance] Stale heartbeats: ${rows.length} candidates, ${sent} email(s)`);
  }
  return { candidates: rows.length, emailed: sent };
}

async function runTrialMaintenance() {
  await enqueueScheduledBackups();
  await alertStaleHeartbeats();
}

function startTrialMaintenanceCron() {
  const cron = require('node-cron');
  // Daily 02:30 — scheduled backups
  cron.schedule('30 2 * * *', () => {
    enqueueScheduledBackups().catch((e) => console.error('[trialMaintenance] backup', e.message));
  });
  // Every 30 minutes — offline check
  cron.schedule('*/30 * * * *', () => {
    alertStaleHeartbeats().catch((e) => console.error('[trialMaintenance] offline', e.message));
  });
  console.log('[trialMaintenance] Daily backup + offline alert cron scheduled');
}

module.exports = {
  runTrialMaintenance,
  enqueueScheduledBackups,
  alertStaleHeartbeats,
  startTrialMaintenanceCron,
};
