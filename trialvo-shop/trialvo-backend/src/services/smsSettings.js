const { pool } = require('../config/db');
const { encrypt, decrypt } = require('../utils/crypto');

const SMS_KEYS = [
  'sms_active_provider',
  'alpha_sms_api_key_enc',
  'alpha_sms_sender_id',
  'bulk_sms_api_key_enc',
  'bulk_sms_sender_id',
  'alpha_sms_enabled',
  'bulk_sms_enabled',
];

const DEFAULTS = {
  sms_active_provider: '',
  alpha_sms_api_key_enc: '',
  alpha_sms_sender_id: '',
  bulk_sms_api_key_enc: '',
  bulk_sms_sender_id: '',
  alpha_sms_enabled: 'false',
  bulk_sms_enabled: 'false',
};

const PROVIDERS = new Set(['', 'alphasms', 'bulksms']);

async function loadConfigMap() {
  const placeholders = SMS_KEYS.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await pool.query(
    `SELECT \`key\`, value FROM system_config WHERE \`key\` IN (${placeholders})`,
    SMS_KEYS
  );
  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

function decryptKey(enc) {
  if (!enc) return '';
  try {
    return decrypt(enc);
  } catch {
    return '';
  }
}

function mapToRuntimeConfig(map) {
  const activeProvider = PROVIDERS.has(map.sms_active_provider) ? map.sms_active_provider : '';
  return {
    activeProvider,
    alphaEnabled: map.alpha_sms_enabled === 'true',
    bulkEnabled: map.bulk_sms_enabled === 'true',
    alphaSenderId: map.alpha_sms_sender_id || '',
    bulkSenderId: map.bulk_sms_sender_id || '',
    alphaApiKey: decryptKey(map.alpha_sms_api_key_enc),
    bulkApiKey: decryptKey(map.bulk_sms_api_key_enc),
    hasAlphaApiKey: Boolean(map.alpha_sms_api_key_enc),
    hasBulkApiKey: Boolean(map.bulk_sms_api_key_enc),
  };
}

/** Full config for sending SMS (includes decrypted API keys). */
async function getSmsConfig() {
  return mapToRuntimeConfig(await loadConfigMap());
}

/** Safe view for admin API — never returns API keys. */
async function getSmsSettingsForAdmin() {
  const cfg = mapToRuntimeConfig(await loadConfigMap());
  return {
    activeProvider: cfg.activeProvider,
    alphaEnabled: cfg.alphaEnabled,
    bulkEnabled: cfg.bulkEnabled,
    alphaSenderId: cfg.alphaSenderId,
    bulkSenderId: cfg.bulkSenderId,
    hasAlphaApiKey: cfg.hasAlphaApiKey,
    hasBulkApiKey: cfg.hasBulkApiKey,
  };
}

async function updateSmsSettings({
  activeProvider,
  alphaEnabled,
  bulkEnabled,
  alphaSenderId,
  bulkSenderId,
  alphaApiKey,
  bulkApiKey,
}) {
  const current = await getSmsConfig();
  const updates = [];

  let nextActive = current.activeProvider;
  if (activeProvider !== undefined) {
    nextActive = String(activeProvider || '').trim().toLowerCase();
    if (!PROVIDERS.has(nextActive)) {
      throw new Error('activeProvider must be alphasms, bulksms, or empty');
    }
  }

  let nextAlphaEnabled = alphaEnabled !== undefined ? Boolean(alphaEnabled) : current.alphaEnabled;
  let nextBulkEnabled = bulkEnabled !== undefined ? Boolean(bulkEnabled) : current.bulkEnabled;

  // Keep "Active provider" and per-provider enable flags consistent:
  // picking a provider enables it; enabling one with no active provider selects it.
  if (activeProvider !== undefined) {
    if (nextActive === 'alphasms') nextAlphaEnabled = true;
    if (nextActive === 'bulksms') nextBulkEnabled = true;
  } else if (!nextActive) {
    if (nextAlphaEnabled && !nextBulkEnabled) nextActive = 'alphasms';
    else if (nextBulkEnabled && !nextAlphaEnabled) nextActive = 'bulksms';
  }

  const nextBulkSender = bulkSenderId !== undefined
    ? String(bulkSenderId || '').trim()
    : current.bulkSenderId;
  // BulkSMS requires a sender id when it is the active provider
  if (nextActive === 'bulksms' && !nextBulkSender) {
    throw new Error('BulkSMS Sender ID is required');
  }

  updates.push(['sms_active_provider', nextActive]);
  updates.push(['alpha_sms_enabled', nextAlphaEnabled ? 'true' : 'false']);
  updates.push(['bulk_sms_enabled', nextBulkEnabled ? 'true' : 'false']);

  if (alphaSenderId !== undefined) updates.push(['alpha_sms_sender_id', String(alphaSenderId || '').trim()]);
  if (bulkSenderId !== undefined) updates.push(['bulk_sms_sender_id', nextBulkSender]);

  // Only rotate keys when admin sends a new non-empty value
  if (alphaApiKey !== undefined && alphaApiKey !== '') {
    updates.push(['alpha_sms_api_key_enc', encrypt(alphaApiKey)]);
  }
  if (bulkApiKey !== undefined && bulkApiKey !== '') {
    updates.push(['bulk_sms_api_key_enc', encrypt(bulkApiKey)]);
  }

  for (const [key, value] of updates) {
    await pool.query(
      'UPDATE system_config SET value = $1, updated_at = NOW() WHERE `key` = $2',
      [value, key]
    );
  }

  return getSmsSettingsForAdmin();
}

module.exports = {
  getSmsConfig,
  getSmsSettingsForAdmin,
  updateSmsSettings,
};
