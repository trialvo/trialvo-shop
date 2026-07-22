const { pool } = require('../config/db');

const TRIAL_KEYS = [
  'trial_auto_approve_hosted',
  'trial_period_hosted_days',
  'trial_period_self_hosted_days',
  'trial_paid_extend_days',
  'trials_enabled',
];

const DEFAULTS = {
  trial_auto_approve_hosted: 'false',
  trial_period_hosted_days: '14',
  trial_period_self_hosted_days: '14',
  trial_paid_extend_days: '365',
  trials_enabled: 'true',
};

async function getTrialSettings() {
  const { rows } = await pool.query(
    'SELECT key, value FROM system_config WHERE key = ANY($1)',
    [TRIAL_KEYS]
  );

  const map = { ...DEFAULTS };
  rows.forEach((r) => { map[r.key] = r.value; });

  return {
    autoApproveHosted: map.trial_auto_approve_hosted === 'true',
    hostedDays: clampDays(map.trial_period_hosted_days),
    selfHostedDays: clampDays(map.trial_period_self_hosted_days),
    paidExtendDays: clampPaidDays(map.trial_paid_extend_days),
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

async function updateTrialSettings({
  autoApproveHosted, hostedDays, selfHostedDays, paidExtendDays, trialsEnabled,
}) {
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
  if (trialsEnabled !== undefined) {
    updates.push(['trials_enabled', trialsEnabled ? 'true' : 'false']);
  }

  for (const [key, value] of updates) {
    await pool.query(
      'UPDATE system_config SET value = $1, updated_at = NOW() WHERE key = $2',
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
