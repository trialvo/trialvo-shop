/**
 * Smoke Phase-close: compose template render + scheduled backup enqueue helper.
 * Usage: node scripts/smoke-phase-close.js
 */
require('dotenv').config();
const { renderComposeTemplate, TEMPLATE_PATH } = require('../src/services/composeTemplate');
const { enqueueScheduledBackups, alertStaleHeartbeats } = require('../src/cron/trialMaintenance');
const fs = require('fs');
const { pool } = require('../src/config/db');

(async () => {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('FAIL template missing', TEMPLATE_PATH);
    process.exit(1);
  }

  const yaml = renderComposeTemplate({
    controlPlaneUrl: 'https://shop.trialvo.com',
    installId: 'abc123def456',
    agentSecret: 'secret',
    bootstrapToken: 'boot',
    subdomain: 'lifestyle-abc123',
    trialDomainBase: 'trial.trialvo.com',
    licensePublicKey: '-----BEGIN PUBLIC KEY-----\nMIIB\n-----END PUBLIC KEY-----',
    dbPassword: 'DbPass1!',
    jwtSecret: 'JwtSecret1!',
    project: 'trial-abc123',
  });

  const yamlOk = yaml.includes('lifestyle-abc123.trial.trialvo.com')
    && yaml.includes('TRIAL_INSTALL_ID: "abc123def456"')
    && !yaml.includes('{{SUBDOMAIN}}');

  // Ensure at least one self_hosted candidate for scheduled backup query (optional)
  const queued = await enqueueScheduledBackups();
  const stale = await alertStaleHeartbeats();

  // Simulate one scheduled command shape
  const { rows } = await pool.query(
    `SELECT id, command, payload, status FROM remote_commands
     WHERE command = 'backup_now' AND (payload->>'scheduled') = 'true'
     ORDER BY created_at DESC LIMIT 1`
  );

  console.log({
    templatePath: TEMPLATE_PATH,
    yamlOk,
    yamlBytes: yaml.length,
    scheduledQueued: queued,
    stale,
    latestScheduledCmd: rows[0] || null,
  });

  const ok = yamlOk;
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
