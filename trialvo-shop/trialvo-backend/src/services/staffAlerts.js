const { pool } = require('../config/db');
const { sendMail } = require('./mailer');
const { FRONTEND } = require('./trialEmails');

/**
 * Staff-facing notifications for work that a human must do.
 *
 * Own-domain trials are fulfilled manually, so a request nobody sees is a
 * customer nobody serves. Every alert here is best-effort: failures are
 * logged, never thrown, so a broken SMTP cannot fail the customer's request.
 */

async function resolveAlertEmail() {
  if (process.env.ADMIN_ALERT_EMAIL) return process.env.ADMIN_ALERT_EMAIL;
  try {
    const { rows } = await pool.query(
      "SELECT email FROM admin_profiles WHERE LOWER(role) IN ('super_admin','admin') ORDER BY created_at ASC LIMIT 1"
    );
    return rows[0]?.email || null;
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelHosting(request) {
  if (request.hosting_source === 'buy_from_trialvo') return 'Needs hosting from Trialvo';
  return `Own hosting — ${String(request.host_kind || '').toUpperCase() || 'unspecified'}`;
}

/** New own-domain trial request landed in the queue. */
async function notifyStaffNewDomainTrial(request, product, { slaHours = 24, sourceDemo = null } = {}) {
  const to = await resolveAlertEmail();
  if (!to) return { ok: false, reason: 'no_alert_email' };

  const productName = typeof product?.name === 'object'
    ? (product.name.en || product.name.bn)
    : (product?.name || product?.slug || 'product');
  const adminUrl = `${FRONTEND}/admin/trial-requests?type=self_hosted&focus=${request.id}`;

  const lines = [
    `New own-domain trial request — deploy within ${slaHours}h.`,
    '',
    `Product: ${productName}`,
    `Customer: ${request.customer_name} <${request.email}> ${request.phone || ''}`,
    `Domain: ${request.desired_domain || '— (buying hosting, domain TBD)'}`,
    `Hosting: ${labelHosting(request)}`,
    `Duration: ${request.requested_months || Math.round((request.requested_days || 30) / 30)} month(s)`,
    sourceDemo ? `Came from instant demo started ${new Date(sourceDemo.created_at).toISOString().slice(0, 10)}` : 'No prior demo on record',
    request.use_case ? `Notes: ${request.use_case}` : '',
    '',
    `Open queue: ${adminUrl}`,
  ].filter((l) => l !== '');

  const html = `<pre style="font:14px/1.5 -apple-system,Segoe UI,sans-serif">${lines.map(escapeHtml).join('\n')}</pre>`;
  const subject = `[Trialvo] Domain trial request — ${request.desired_domain || request.email}`;

  try {
    await sendMail({ to, subject, text: lines.join('\n'), html });
    await pool.query('UPDATE trial_requests SET staff_alerted_at = NOW() WHERE id = $1', [request.id]);
    return { ok: true };
  } catch (e) {
    console.error('[staffAlerts] new domain trial alert failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

/** A manually deployed trial passed its expiry — staff must take it down or convert. */
async function notifyStaffManualTrialExpired(instance, request, product) {
  const to = await resolveAlertEmail();
  if (!to) return { ok: false, reason: 'no_alert_email' };

  const productName = typeof product?.name === 'object'
    ? (product.name.en || product.name.bn)
    : (product?.name || product?.slug || 'product');

  const lines = [
    'A staff-deployed trial has expired. No agent is installed, so nothing was frozen automatically.',
    '',
    `Product: ${productName}`,
    `Customer: ${request?.customer_name || '—'} <${request?.email || '—'}>`,
    `Domain: ${instance.domain || instance.shop_url || '—'}`,
    `Expired at: ${instance.expires_at ? new Date(instance.expires_at).toISOString() : '—'}`,
    '',
    'Action: contact the customer to convert, or take the deployment down.',
    `Instance: ${FRONTEND}/admin/trial-instances?focus=${instance.id}`,
  ];
  const html = `<pre style="font:14px/1.5 -apple-system,Segoe UI,sans-serif">${lines.map(escapeHtml).join('\n')}</pre>`;
  const subject = `[Trialvo] Manual trial expired — ${instance.domain || request?.email || instance.id.slice(0, 8)}`;

  try {
    await sendMail({ to, subject, text: lines.join('\n'), html });
    return { ok: true };
  } catch (e) {
    console.error('[staffAlerts] manual expiry alert failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

module.exports = {
  resolveAlertEmail,
  notifyStaffNewDomainTrial,
  notifyStaffManualTrialExpired,
};
