const { pool } = require('../config/db');
const { sendMail } = require('./mailer');
const { sendSms } = require('./smsSender');
const { FRONTEND } = require('./trialEmails');

/**
 * Staff-facing notifications for work that a human must do.
 *
 * Two-layer gate: global system_config flag AND per-admin matrix AND
 * admin.is_active. SMS also requires a phone number. Every alert is
 * best-effort — failures are logged, never thrown.
 */

const EVENTS = Object.freeze(['purchase', 'extend', 'domain_trial', 'manual_expiry']);
const CHANNELS = Object.freeze(['email', 'sms']);

const PERMISSION_COLUMNS = Object.freeze({
  purchase_email: true,
  purchase_sms: true,
  extend_email: true,
  extend_sms: true,
  domain_trial_email: true,
  domain_trial_sms: true,
  manual_expiry_email: true,
  manual_expiry_sms: true,
});

async function resolveAlertEmail() {
  if (process.env.ADMIN_ALERT_EMAIL) return process.env.ADMIN_ALERT_EMAIL;
  try {
    const { rows } = await pool.query(
      "SELECT email FROM admin_profiles WHERE is_active = 1 AND LOWER(role) IN ('super_admin','admin') ORDER BY created_at ASC LIMIT 1"
    );
    return rows[0]?.email || null;
  } catch {
    return null;
  }
}

async function isGlobalOn(event, channel) {
  if (!EVENTS.includes(event) || !CHANNELS.includes(channel)) return false;
  try {
    const { rows } = await pool.query(
      'SELECT value FROM system_config WHERE `key` = $1',
      [`notify.${event}.${channel}`]
    );
    return rows[0]?.value === 'true';
  } catch {
    return false;
  }
}

function permissionColumn(event, channel) {
  return `${event}_${channel}`;
}

/**
 * Active admins whose matrix flag is on for this event/channel.
 * SMS recipients must have a phone number.
 */
async function resolveRecipients(event, channel) {
  const col = permissionColumn(event, channel);
  if (!PERMISSION_COLUMNS[col]) return [];

  let sql = `
    SELECT a.id, a.email, a.phone, a.full_name
    FROM admin_profiles a
    INNER JOIN admin_notification_permissions p ON p.admin_id = a.id
    WHERE a.is_active = 1 AND p.\`${col}\` = 1
  `;
  if (channel === 'sms') {
    sql += ` AND a.phone IS NOT NULL AND TRIM(a.phone) <> ''`;
  } else {
    sql += ` AND a.email IS NOT NULL AND TRIM(a.email) <> ''`;
  }

  try {
    const { rows } = await pool.query(sql);
    return rows;
  } catch (e) {
    console.error('[staffAlerts] resolveRecipients failed:', e.message);
    return [];
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function productLabel(product) {
  if (!product) return 'product';
  if (typeof product.name === 'object') return product.name.en || product.name.bn || product.slug || 'product';
  return product.name || product.slug || 'product';
}

async function fanOutEmail(event, { subject, text, html }) {
  if (!(await isGlobalOn(event, 'email'))) return { ok: false, reason: 'global_email_off' };

  let recipients = await resolveRecipients(event, 'email');
  // Legacy single-recipient fallback only when the global email flag is on
  // and nobody is on the matrix — keeps existing ADMIN_ALERT_EMAIL behavior.
  if (!recipients.length) {
    const fallback = await resolveAlertEmail();
    if (fallback) recipients = [{ id: null, email: fallback, phone: null, full_name: 'Alert' }];
  }
  if (!recipients.length) return { ok: false, reason: 'no_recipients' };

  const results = [];
  for (const r of recipients) {
    try {
      await sendMail({ to: r.email, subject, text, html });
      results.push({ email: r.email, ok: true });
    } catch (e) {
      console.error('[staffAlerts] email failed:', r.email, e.message);
      results.push({ email: r.email, ok: false, reason: e.message });
    }
  }
  return { ok: results.some((r) => r.ok), results };
}

async function fanOutSms(event, message) {
  if (!(await isGlobalOn(event, 'sms'))) return { ok: false, reason: 'global_sms_off' };

  const recipients = await resolveRecipients(event, 'sms');
  if (!recipients.length) return { ok: false, reason: 'no_recipients' };

  const results = [];
  for (const r of recipients) {
    const res = await sendSms(r.phone, message);
    if (!res.ok) console.error('[staffAlerts] sms failed:', r.phone, res.reason);
    results.push({ phone: r.phone, ...res });
  }
  return { ok: results.some((r) => r.ok), results };
}

function preBlock(lines) {
  return `<pre style="font:14px/1.5 -apple-system,Segoe UI,sans-serif">${lines.map(escapeHtml).join('\n')}</pre>`;
}

/** New own-domain trial request landed in the queue. */
async function notifyStaffNewDomainTrial(request, product, { slaHours = 24, sourceDemo = null } = {}) {
  const name = productLabel(product);
  const adminUrl = `${FRONTEND}/admin/trial-requests?type=self_hosted&focus=${request.id}`;

  const lines = [
    `New own-domain trial request — deploy within ${slaHours}h.`,
    '',
    `Product: ${name}`,
    `Customer: ${request.customer_name} <${request.email}> ${request.phone || ''}`,
    `Domain: ${request.desired_domain || '—'}`,
    `Hosting: ${request.host_kind === 'cpanel' ? 'cPanel' : 'VPS'}`,
    `Duration: ${request.requested_months || Math.round((request.requested_days || 30) / 30)} month(s)`,
    sourceDemo ? `Came from instant demo started ${new Date(sourceDemo.created_at).toISOString().slice(0, 10)}` : 'No prior demo on record',
    request.use_case ? `Notes: ${request.use_case}` : '',
    '',
    `Open queue: ${adminUrl}`,
  ].filter((l) => l !== '');

  const subject = `[Trialvo] Domain trial request — ${request.desired_domain || request.email}`;
  const sms = `[Trialvo] Domain trial ${request.desired_domain || request.email} — ${name} — ${request.customer_name || ''} ${request.phone || ''} — deploy ${slaHours}h`.trim();

  try {
    const emailRes = await fanOutEmail('domain_trial', {
      subject,
      text: lines.join('\n'),
      html: preBlock(lines),
    });
    const smsRes = await fanOutSms('domain_trial', sms);
    if (emailRes.ok || smsRes.ok) {
      await pool.query('UPDATE trial_requests SET staff_alerted_at = NOW() WHERE id = $1', [request.id]);
    }
    return { ok: Boolean(emailRes.ok || smsRes.ok), email: emailRes, sms: smsRes };
  } catch (e) {
    console.error('[staffAlerts] new domain trial alert failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

/** A manually deployed trial passed its expiry — staff must take it down or convert. */
async function notifyStaffManualTrialExpired(instance, request, product) {
  const name = productLabel(product);
  const domain = instance.domain || instance.shop_url || '—';

  const lines = [
    'A staff-deployed trial has expired. No agent is installed, so nothing was frozen automatically.',
    '',
    `Product: ${name}`,
    `Customer: ${request?.customer_name || '—'} <${request?.email || '—'}>`,
    `Domain: ${domain}`,
    `Expired at: ${instance.expires_at ? new Date(instance.expires_at).toISOString() : '—'}`,
    '',
    'Action: contact the customer to convert, or take the deployment down.',
    `Instance: ${FRONTEND}/admin/trial-instances?focus=${instance.id}`,
  ];
  const subject = `[Trialvo] Manual trial expired — ${instance.domain || request?.email || String(instance.id || '').slice(0, 8)}`;
  const sms = `[Trialvo] Manual trial expired — ${domain} — ${name} — ${request?.email || ''}`.trim();

  try {
    const emailRes = await fanOutEmail('manual_expiry', {
      subject,
      text: lines.join('\n'),
      html: preBlock(lines),
    });
    const smsRes = await fanOutSms('manual_expiry', sms);
    return { ok: Boolean(emailRes.ok || smsRes.ok), email: emailRes, sms: smsRes };
  } catch (e) {
    console.error('[staffAlerts] manual expiry alert failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

async function notifyStaffPurchase({ order, product } = {}) {
  const name = productLabel(product);
  const orderRef = order?.order_id || order?.id || '—';
  const lines = [
    'New product purchase — license / fulfillment may need staff attention.',
    '',
    `Order: ${orderRef}`,
    `Product: ${name}`,
    `Customer: ${order?.customer_name || '—'} <${order?.customer_email || '—'}> ${order?.customer_phone || ''}`,
    `Total: ${order?.total_bdt != null ? `${order.total_bdt} BDT` : '—'}`,
    '',
    `Open orders: ${FRONTEND}/admin/orders?focus=${orderRef}`,
  ];
  const subject = `[Trialvo] Purchase — ${name} — ${orderRef}`;
  const sms = `[Trialvo] Purchase ${orderRef} — ${name} — ${order?.customer_name || ''} ${order?.customer_phone || ''}`.trim();

  try {
    const emailRes = await fanOutEmail('purchase', {
      subject,
      text: lines.join('\n'),
      html: preBlock(lines),
    });
    const smsRes = await fanOutSms('purchase', sms);
    return { ok: Boolean(emailRes.ok || smsRes.ok), email: emailRes, sms: smsRes };
  } catch (e) {
    console.error('[staffAlerts] purchase alert failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

async function notifyStaffTrialExtend({ order, instance, product } = {}) {
  const name = productLabel(product);
  const orderRef = order?.order_id || order?.id || '—';
  const domain = instance?.domain || instance?.shop_url || instance?.id || '—';
  const lines = [
    'A trial extend pack was paid.',
    '',
    `Order: ${orderRef}`,
    `Product: ${name}`,
    `Instance: ${domain}`,
    `Days: ${order?.extend_days || instance?.days || '—'}`,
    `Customer: ${order?.customer_name || '—'} <${order?.customer_email || '—'}> ${order?.customer_phone || ''}`,
    '',
    `Open instance: ${FRONTEND}/admin/trial-instances?focus=${instance?.id || ''}`,
  ];
  const subject = `[Trialvo] Trial extend — ${name} — ${orderRef}`;
  const sms = `[Trialvo] Extend ${orderRef} — ${name} — ${domain}`.trim();

  try {
    const emailRes = await fanOutEmail('extend', {
      subject,
      text: lines.join('\n'),
      html: preBlock(lines),
    });
    const smsRes = await fanOutSms('extend', sms);
    return { ok: Boolean(emailRes.ok || smsRes.ok), email: emailRes, sms: smsRes };
  } catch (e) {
    console.error('[staffAlerts] extend alert failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

module.exports = {
  EVENTS,
  CHANNELS,
  resolveAlertEmail,
  isGlobalOn,
  resolveRecipients,
  notifyStaffNewDomainTrial,
  notifyStaffManualTrialExpired,
  notifyStaffPurchase,
  notifyStaffTrialExtend,
};
