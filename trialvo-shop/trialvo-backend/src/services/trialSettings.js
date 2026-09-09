const { pool } = require('../config/db');

/**
 * Single source of truth for every trial knob the admin can turn.
 *
 * Two public paths read from here:
 *   - Instant demo  (hosted)      → demoEnabled, hostedDays, abuse limits
 *   - Own-domain    (self_hosted) → domainEnabled, domainMonths, defaultMonths,
 *                                   hostingPurchaseEnabled, fulfillmentSlaHours
 *
 * Marketing copy on the home/product pages reads the same values through
 * GET /api/trial/config, so "1 month free on your domain" can never drift from what
 * the admin actually allows.
 */
const TRIAL_KEYS = [
  'trial_auto_approve_hosted',
  'trial_period_hosted_days',
  'trial_period_self_hosted_days',
  'trial_paid_extend_days',
  'trial_extend_days',
  'trial_extend_price_bdt',
  'trial_extend_price_usd',
  'trials_enabled',
  'trial_demo_enabled',
  'trial_domain_enabled',
  'trial_domain_months',
  'trial_domain_default_months',
  'trial_hosting_purchase_enabled',
  'trial_fulfillment_sla_hours',
  'trial_demo_reset_enabled',
  'trial_demo_max_per_email_day',
  'trial_demo_max_per_ip_hour',
];

const DEFAULTS = {
  trial_auto_approve_hosted: 'true',
  trial_period_hosted_days: '14',
  trial_period_self_hosted_days: '30',
  trial_paid_extend_days: '365',
  trial_extend_days: '30',
  trial_extend_price_bdt: '1500',
  trial_extend_price_usd: '15',
  trials_enabled: 'true',
  trial_demo_enabled: 'true',
  trial_domain_enabled: 'true',
  trial_domain_months: '1',
  trial_domain_default_months: '1',
  trial_hosting_purchase_enabled: 'true',
  trial_fulfillment_sla_hours: '24',
  trial_demo_reset_enabled: 'false',
  trial_demo_max_per_email_day: '3',
  trial_demo_max_per_ip_hour: '5',
};

/** Hard ceiling — a "free trial" longer than a quarter is a pricing decision, not a setting. */
const MAX_TRIAL_MONTHS = 3;
const MIN_TRIAL_MONTHS = 1;

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

  const domainMonths = parseMonthsList(map.trial_domain_months);
  const defaultMonths = clampMonths(map.trial_domain_default_months, domainMonths[0]);

  return {
    autoApproveHosted: map.trial_auto_approve_hosted !== 'false',
    hostedDays: clampDays(map.trial_period_hosted_days),
    selfHostedDays: clampDays(map.trial_period_self_hosted_days, 30),
    // Full product purchase → convert / long extend
    paidExtendDays: clampPaidDays(map.trial_paid_extend_days),
    // Paid trial-extend pack (separate from product buy)
    extendDays: clampDays(map.trial_extend_days, 30),
    extendPriceBdt: clampMoney(map.trial_extend_price_bdt, 1500),
    extendPriceUsd: clampMoney(map.trial_extend_price_usd, 15),
    trialsEnabled: map.trials_enabled !== 'false',

    // Instant demo path
    demoEnabled: map.trial_demo_enabled !== 'false',
    demoMaxPerEmailDay: clampInt(map.trial_demo_max_per_email_day, 3, 1, 50),
    demoMaxPerIpHour: clampInt(map.trial_demo_max_per_ip_hour, 5, 1, 100),
    demoResetEnabled: map.trial_demo_reset_enabled === 'true',

    // Own-domain path
    domainEnabled: map.trial_domain_enabled !== 'false',
    domainMonths,
    // Only advertise a default that is actually offered.
    defaultMonths: domainMonths.includes(defaultMonths) ? defaultMonths : domainMonths[0],
    hostingPurchaseEnabled: map.trial_hosting_purchase_enabled !== 'false',
    fulfillmentSlaHours: clampInt(map.trial_fulfillment_sla_hours, 24, 1, 168),
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

function clampInt(raw, fallback, min, max) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function clampMonths(raw, fallback = 1) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, MIN_TRIAL_MONTHS), MAX_TRIAL_MONTHS);
}

/**
 * "1,2,3" → [1,2,3]; tolerant of spaces, duplicates and junk.
 * Always returns at least one preset so the UI never renders an empty picker.
 */
function parseMonthsList(raw) {
  const list = String(raw ?? '')
    .split(/[,\s]+/)
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n) && n >= MIN_TRIAL_MONTHS && n <= MAX_TRIAL_MONTHS);
  const unique = [...new Set(list)].sort((a, b) => a - b);
  return unique.length ? unique : [1];
}

/** Months → days for storage compat (calendar month ≈ 30 days; expiry uses real calendar math). */
function monthsToDays(months) {
  return clampMonths(months) * 30;
}

/** Expiry date `months` calendar months after `from` (defaults to now). */
function expiresAtForMonths(months, from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + clampMonths(months));
  return d;
}

async function updateTrialSettings({
  autoApproveHosted, hostedDays, selfHostedDays, paidExtendDays,
  extendDays, extendPriceBdt, extendPriceUsd, trialsEnabled,
  demoEnabled, domainEnabled, domainMonths, defaultMonths,
  hostingPurchaseEnabled, fulfillmentSlaHours, demoResetEnabled,
  demoMaxPerEmailDay, demoMaxPerIpHour,
}) {
  await ensureTrialConfigRows();
  const updates = [];
  const bool = (v) => (v ? 'true' : 'false');

  if (autoApproveHosted !== undefined) updates.push(['trial_auto_approve_hosted', bool(autoApproveHosted)]);
  if (hostedDays !== undefined) updates.push(['trial_period_hosted_days', String(clampDays(hostedDays))]);
  if (selfHostedDays !== undefined) updates.push(['trial_period_self_hosted_days', String(clampDays(selfHostedDays, 30))]);
  if (paidExtendDays !== undefined) updates.push(['trial_paid_extend_days', String(clampPaidDays(paidExtendDays))]);
  if (extendDays !== undefined) updates.push(['trial_extend_days', String(clampDays(extendDays, 30))]);
  if (extendPriceBdt !== undefined) updates.push(['trial_extend_price_bdt', String(clampMoney(extendPriceBdt, 1500))]);
  if (extendPriceUsd !== undefined) updates.push(['trial_extend_price_usd', String(clampMoney(extendPriceUsd, 15))]);
  if (trialsEnabled !== undefined) updates.push(['trials_enabled', bool(trialsEnabled)]);

  if (demoEnabled !== undefined) updates.push(['trial_demo_enabled', bool(demoEnabled)]);
  if (domainEnabled !== undefined) updates.push(['trial_domain_enabled', bool(domainEnabled)]);
  if (domainMonths !== undefined) {
    const list = Array.isArray(domainMonths) ? domainMonths.join(',') : String(domainMonths);
    updates.push(['trial_domain_months', parseMonthsList(list).join(',')]);
  }
  if (defaultMonths !== undefined) updates.push(['trial_domain_default_months', String(clampMonths(defaultMonths))]);
  if (hostingPurchaseEnabled !== undefined) updates.push(['trial_hosting_purchase_enabled', bool(hostingPurchaseEnabled)]);
  if (fulfillmentSlaHours !== undefined) updates.push(['trial_fulfillment_sla_hours', String(clampInt(fulfillmentSlaHours, 24, 1, 168))]);
  if (demoResetEnabled !== undefined) updates.push(['trial_demo_reset_enabled', bool(demoResetEnabled)]);
  if (demoMaxPerEmailDay !== undefined) updates.push(['trial_demo_max_per_email_day', String(clampInt(demoMaxPerEmailDay, 3, 1, 50))]);
  if (demoMaxPerIpHour !== undefined) updates.push(['trial_demo_max_per_ip_hour', String(clampInt(demoMaxPerIpHour, 5, 1, 100))]);

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

/**
 * Shape exposed to the public site. Keep it small — no abuse thresholds, no
 * internal toggles the storefront does not need.
 */
function toPublicConfig(settings) {
  return {
    trialsEnabled: settings.trialsEnabled,
    // Instant demo
    demoEnabled: settings.trialsEnabled && settings.demoEnabled,
    demoAccessDays: settings.hostedDays,
    // Own-domain trial
    domainTrialEnabled: settings.trialsEnabled && settings.domainEnabled,
    domainMonths: settings.domainMonths,
    defaultMonths: settings.defaultMonths,
    maxMonths: settings.domainMonths[settings.domainMonths.length - 1],
    hostingPurchaseEnabled: settings.hostingPurchaseEnabled,
    fulfillmentSlaHours: settings.fulfillmentSlaHours,
    // Legacy fields still read by the status page / checkout
    hostedDays: settings.hostedDays,
    selfHostedDays: settings.selfHostedDays,
    autoApproveHosted: settings.autoApproveHosted,
    extendDays: settings.extendDays,
    extendPriceBdt: settings.extendPriceBdt,
    extendPriceUsd: settings.extendPriceUsd,
    paidExtendDays: settings.paidExtendDays,
  };
}

module.exports = {
  getTrialSettings,
  updateTrialSettings,
  defaultDaysForType,
  toPublicConfig,
  clampDays,
  clampPaidDays,
  clampMonths,
  parseMonthsList,
  monthsToDays,
  expiresAtForMonths,
  MAX_TRIAL_MONTHS,
  MIN_TRIAL_MONTHS,
};
