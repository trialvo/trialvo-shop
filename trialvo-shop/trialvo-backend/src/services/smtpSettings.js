const { pool } = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const SMTP_KEYS = [
  'smtp_enabled',
  'smtp_host',
  'smtp_port',
  'smtp_secure',
  'smtp_user',
  'smtp_password_enc',
  'smtp_from_email',
  'smtp_from_name',
];

const DEFAULTS = {
  smtp_enabled: 'false',
  smtp_host: '',
  smtp_port: '587',
  smtp_secure: 'false',
  smtp_user: '',
  smtp_password_enc: '',
  smtp_from_email: 'noreply@trialvo.com',
  smtp_from_name: 'Trialvo Shop',
};

async function loadConfigMap() {
  const placeholders = SMTP_KEYS.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await pool.query(
    `SELECT \`key\`, value FROM system_config WHERE \`key\` IN (${placeholders})`,
    SMTP_KEYS
  );
  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

function mapToRuntimeConfig(map) {
  let password = '';
  if (map.smtp_password_enc) {
    try {
      password = decrypt(map.smtp_password_enc);
    } catch {
      password = '';
    }
  }

  return {
    enabled: map.smtp_enabled === 'true',
    host: map.smtp_host || '',
    port: parseInt(map.smtp_port || '587', 10) || 587,
    secure: map.smtp_secure === 'true',
    user: map.smtp_user || '',
    password,
    fromEmail: map.smtp_from_email || 'noreply@trialvo.com',
    fromName: map.smtp_from_name || 'Trialvo Shop',
    hasPassword: Boolean(map.smtp_password_enc),
  };
}

/** Full config for sending mail (includes decrypted password). */
async function getSmtpConfig() {
  return mapToRuntimeConfig(await loadConfigMap());
}

/** Safe view for admin API — never returns the password. */
async function getSmtpSettingsForAdmin() {
  const cfg = mapToRuntimeConfig(await loadConfigMap());
  return {
    enabled: cfg.enabled,
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    user: cfg.user,
    hasPassword: cfg.hasPassword,
    fromEmail: cfg.fromEmail,
    fromName: cfg.fromName,
  };
}

async function updateSmtpSettings({
  enabled, host, port, secure, user, password, fromEmail, fromName,
}) {
  const current = await loadConfigMap();
  const updates = [];

  if (enabled !== undefined) {
    updates.push(['smtp_enabled', enabled ? 'true' : 'false']);
  }
  if (host !== undefined) updates.push(['smtp_host', host || '']);
  if (port !== undefined) updates.push(['smtp_port', String(parseInt(port, 10) || 587)]);
  if (secure !== undefined) updates.push(['smtp_secure', secure ? 'true' : 'false']);
  if (user !== undefined) updates.push(['smtp_user', user || '']);
  if (fromEmail !== undefined) updates.push(['smtp_from_email', fromEmail || '']);
  if (fromName !== undefined) updates.push(['smtp_from_name', fromName || '']);

  // Only rotate password when admin sends a new non-empty value
  if (password !== undefined && password !== '') {
    updates.push(['smtp_password_enc', encrypt(password)]);
  }

  for (const [key, value] of updates) {
    await pool.query(
      'UPDATE system_config SET value = $1, updated_at = NOW() WHERE `key` = $2',
      [value, key]
    );
  }

  return getSmtpSettingsForAdmin();
}

function formatFromAddress(cfg) {
  if (cfg.fromName && cfg.fromEmail) {
    return `"${cfg.fromName.replace(/"/g, '\\"')}" <${cfg.fromEmail}>`;
  }
  return cfg.fromEmail || 'Trialvo Shop <noreply@trialvo.com>';
}

module.exports = {
  getSmtpConfig,
  getSmtpSettingsForAdmin,
  updateSmtpSettings,
  formatFromAddress,
};
