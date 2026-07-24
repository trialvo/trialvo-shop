const { pool } = require('../config/db');

const TRIAL_KEYS = [
  'trial_auto_approve_hosted',
  'trial_period_hosted_days',
  'trial_period_self_hosted_days',
  'trial_paid_extend_days',
  'trial_extend_days',
  'trial_extend_price_bdt',
  'trial_extend_price_usd',
  'trials_enabled',
];

const DEFAULTS = {
  trial_auto_approve_hosted: 'false',
  trial_period_hosted_days: '14',
  trial_period_self_hosted_days: '14',
  trial_paid_extend_days: '365',
  trial_extend_days: '30',
  trial_extend_price_bdt: '1500',
  trial_extend_price_usd: '15',
  trials_enabled: 'true',
};

async function ensureTrialConfigRows() {
  for (const key of TRIAL_KEYS) {
    await pool.query(
      'INSERT IGNORE INTO system_config (`key`, value, description) VALUES (?, ?, ?)',
      [key, DEFAULTS[key], key]
    );
  }
}

async function getTrialSettings() {
  await ensureTrialConfigRows();
  const placeholders = TRIAL_KEYS.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await pool.query(
    `SELECT \`key\`, value FROM system_config WHERE \`key\` IN (${placeholders})`,
    TRIAL_KEYS
  );

  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });

  return {
    autoApproveHosted: map.trial_auto_approve_hosted === 'true',
    hostedDays: clampDays(map.trial_period_hosted_days),
    selfHostedDays: clampDays(map.trial_period_self_hosted_days),
    // Full product purchase → convert / long extend
    paidExtendDays: clampPaidDays(map.trial_paid_extend_days),
    // Paid trial-extend pack (separate from product buy)
    extendDays: clampDays(map.trial_extend_days, 30),
    extendPriceBdt: clampMoney(map.trial_extend_price_bdt, 1500),
    extendPriceUsd: clampMoney(map.trial_extend_price_usd, 15),
    trialsEnabled: map.trials_enabled !== 'false',
  };
}

function clampDays(raw, fallback = 14) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 365);
}

/** Paid conversion may grant up to 10 years. */
function clampPaidDays(raw, fallback = 365) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 3650);
}

function clampMoney(raw, fallback = 0) {
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n * 100) / 100;
}

async function updateTrialSettings({
  autoApproveHosted, hostedDays, selfHostedDays, paidExtendDays,
  extendDays, extendPriceBdt, extendPriceUsd, trialsEnabled,
}) {
  await ensureTrialConfigRows();
  const updates = [];

  if (autoApproveHosted !== undefined) {
    updates.push(['trial_auto_approve_hosted', autoApproveHosted ? 'true' : 'false']);
  }
  if (hostedDays !== undefined) {
    updates.push(['trial_period_hosted_days', String(clampDays(hostedDays))]);
  }
  if (selfHostedDays !== undefined) {
    updates.push(['trial_period_self_hosted_days', String(clampDays(selfHostedDays))]);
  }
  if (paidExtendDays !== undefined) {
    updates.push(['trial_paid_extend_days', String(clampPaidDays(paidExtendDays))]);
  }
  if (extendDays !== undefined) {
    updates.push(['trial_extend_days', String(clampDays(extendDays, 30))]);
  }
  if (extendPriceBdt !== undefined) {
    updates.push(['trial_extend_price_bdt', String(clampMoney(extendPriceBdt, 1500))]);
  }
  if (extendPriceUsd !== undefined) {
    updates.push(['trial_extend_price_usd', String(clampMoney(extendPriceUsd, 15))]);
  }
  if (trialsEnabled !== undefined) {
    updates.push(['trials_enabled', trialsEnabled ? 'true' : 'false']);
  }

  for (const [key, value] of updates) {
    await pool.query(
      'UPDATE system_config SET value = $1, updated_at = NOW() WHERE `key` = $2',
      [value, key]
    );
  }

  return getTrialSettings();
}

function defaultDaysForType(settings, trialType) {
  return trialType === 'self_hosted' ? settings.selfHostedDays : settings.hostedDays;
}

module.exports = {
  getTrialSettings,
  updateTrialSettings,
  defaultDaysForType,
  clampDays,
  clampPaidDays,
};
