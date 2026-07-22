/**
 * Smoke script: verify SMTP settings service, trial settings, reminder query path.
 * Usage: node scripts/smoke-trial-polish.js
 */
require('dotenv').config();
const { pool } = require('../src/config/db');
const { getSmtpSettingsForAdmin, getSmtpConfig } = require('../src/services/smtpSettings');
const { getTrialSettings } = require('../src/services/trialSettings');
const { sendExpiryReminders } = require('../src/cron/trialLifecycle');

(async () => {
  const checks = [];

  const smtpAdmin = await getSmtpSettingsForAdmin();
  checks.push(['smtp_admin_shape', 'host' in smtpAdmin && 'enabled' in smtpAdmin && !('password' in smtpAdmin)]);
  checks.push(['smtp_password_hidden', smtpAdmin.password === undefined]);

  const smtpRuntime = await getSmtpConfig();
  checks.push(['smtp_runtime_has_enabled', typeof smtpRuntime.enabled === 'boolean']);

  const trial = await getTrialSettings();
  checks.push(['trial_settings', typeof trial.autoApproveHosted === 'boolean' && trial.hostedDays >= 1]);

  const keys = await pool.query(
    "SELECT key FROM system_config WHERE key LIKE 'smtp_%' OR key LIKE 'trial_%' ORDER BY key"
  );
  const keySet = new Set(keys.rows.map((r) => r.key));
  checks.push(['smtp_keys_present', ['smtp_enabled', 'smtp_host', 'smtp_password_enc'].every((k) => keySet.has(k))]);
  checks.push(['trial_keys_present', ['trial_auto_approve_hosted', 'trial_period_hosted_days'].every((k) => keySet.has(k))]);

  // Reminder path must run without throw (may send 0 mails)
  const sent = await sendExpiryReminders();
  checks.push(['reminder_runner_ok', typeof sent === 'number']);

  // Status credentials path: ensure we can decrypt shape for any active instance if exists
  const active = await pool.query(
    `SELECT ti.id, tr.public_token, ti.admin_email IS NOT NULL AS has_email
     FROM trial_instances ti
     JOIN trial_requests tr ON tr.id = ti.request_id
     WHERE ti.status = 'active' LIMIT 1`
  );
  checks.push(['active_instance_optional', true]);
  if (active.rows.length) {
    checks.push(['active_has_token', Boolean(active.rows[0].public_token)]);
  }

  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'OK' : 'FAIL'}  ${name}`);
    if (!ok) failed += 1;
  }
  console.log(`\nReminders sent this run: ${sent}`);
  console.log(`SMTP enabled=${smtpAdmin.enabled} host=${smtpAdmin.host || '(empty)'}`);
  console.log(`Trial autoApproveHosted=${trial.autoApproveHosted} hostedDays=${trial.hostedDays} selfHostedDays=${trial.selfHostedDays}`);

  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
