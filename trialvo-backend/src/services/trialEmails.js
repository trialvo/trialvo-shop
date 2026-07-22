const FRONTEND = (process.env.FRONTEND_URL || 'http://localhost:8091').replace(/\/$/, '');
const API_PUBLIC = (process.env.PUBLIC_API_URL
  || process.env.FRONTEND_URL?.replace(':8000', ':8092')?.replace(':8091', ':8092')
  || 'http://localhost:8092').replace(/\/$/, '');

function trialRequestReceivedEmail({ name, statusUrl, autoApproved }) {
  const subject = autoApproved
    ? 'Your Trialvo trial is ready!'
    : 'Trial request received — Trialvo';

  const text = autoApproved
    ? [
        `Hi ${name},`,
        '',
        'Great news — your Trialvo-hosted trial was approved automatically.',
        `View your login details and links: ${statusUrl}`,
        '',
        'We also sent your credentials in this email thread. Save this link to access them anytime.',
      ].join('\n')
    : [
        `Hi ${name},`,
        '',
        'We received your trial request and our team will review it shortly.',
        `Track your request status anytime: ${statusUrl}`,
        '',
        'You will receive another email with login details once approved.',
      ].join('\n');

  const html = autoApproved
    ? wrapHtml(`
        <p>Hi ${escapeHtml(name)},</p>
        <p><strong>Your Trialvo-hosted trial is ready!</strong></p>
        <p><a href="${statusUrl}">Open your trial status page</a> to see shop/admin links and login credentials.</p>
      `)
    : wrapHtml(`
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received your trial request. Our team will review it shortly.</p>
        <p><a href="${statusUrl}">Track request status</a></p>
        <p>You will receive login details by email once approved.</p>
      `);

  return { subject, text, html };
}

function trialReadyEmail({
  name, days, shopUrl, adminUrl, adminEmail, adminPassword,
  statusUrl, trialType, installId, bootstrapToken, installerUrl,
}) {
  const subject = 'Your Trialvo trial is ready';
  const isSelfHosted = trialType === 'self_hosted';

  const lines = [
    `Hi ${name},`,
    '',
    isSelfHosted
      ? `Your self-hosted trial has been approved for ${days} days.`
      : `Your trial is active for ${days} days.`,
    '',
    shopUrl ? `Shop: ${shopUrl}` : '',
    adminUrl ? `Admin panel: ${adminUrl}` : '',
    adminEmail ? `Admin email: ${adminEmail}` : '',
    adminPassword ? `Admin password: ${adminPassword}` : '',
    isSelfHosted && installId ? `Install ID: ${installId}` : '',
    isSelfHosted && bootstrapToken ? `Bootstrap token: ${bootstrapToken}` : '',
    isSelfHosted && installerUrl ? `Installer download: ${installerUrl}` : '',
    isSelfHosted ? 'Setup: unzip → edit .env → run setup.sh (or setup.ps1). See TRIAL_TERMS.md.' : '',
    '',
    `View anytime: ${statusUrl}`,
    '',
    'Save these credentials — you can also retrieve them from your status page link.',
  ].filter(Boolean);

  const selfHostedBlock = isSelfHosted
    ? `<p><strong>Install ID:</strong> <code>${installId}</code><br/>
       <strong>Bootstrap token:</strong> <code>${bootstrapToken}</code></p>
       ${installerUrl ? `<p><a href="${installerUrl}">Download installer package</a></p>
       <p style="font-size:13px;color:#555;">Unzip → edit <code>.env</code> → run <code>setup.sh</code> or <code>setup.ps1</code>. Read TRIAL_TERMS.md.</p>` : ''}`
    : '';

  const html = wrapHtml(`
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your trial is <strong>active for ${days} days</strong>.</p>
    ${shopUrl ? `<p><a href="${shopUrl}">Open shop</a></p>` : ''}
    ${adminUrl ? `<p><a href="${adminUrl}">Open admin panel</a></p>` : ''}
    <div style="background:#f4f4f5;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Admin login</strong></p>
      <p style="margin:0;">Email: <code>${escapeHtml(adminEmail)}</code><br/>
      Password: <code>${escapeHtml(adminPassword)}</code></p>
    </div>
    ${selfHostedBlock}
    <p><a href="${statusUrl}">View trial status & credentials</a></p>
  `);

  return { subject, text: lines.join('\n'), html };
}

function trialExpiryReminderEmail({ name, daysLeft, productName, statusUrl, expiresAt }) {
  const urgent = daysLeft <= 1;
  const subject = urgent
    ? `Your Trialvo trial expires tomorrow — ${productName || 'your product'}`
    : `Your Trialvo trial expires in ${daysLeft} days — ${productName || 'your product'}`;

  const when = expiresAt
    ? new Date(expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : `${daysLeft} day(s)`;

  const text = [
    `Hi ${name},`,
    '',
    urgent
      ? `Reminder: your trial ends soon (${when}).`
      : `Reminder: your trial will expire in about ${daysLeft} days (${when}).`,
    '',
    'Open your status page to view shop/admin links and credentials:',
    statusUrl,
    '',
    'To continue after expiry, contact Trialvo to purchase or extend your trial.',
  ].join('\n');

  const html = wrapHtml(`
    <p>Hi ${escapeHtml(name)},</p>
    <p>${urgent
      ? `Your trial for <strong>${escapeHtml(productName || 'your product')}</strong> ends soon (<strong>${escapeHtml(when)}</strong>).`
      : `Your trial for <strong>${escapeHtml(productName || 'your product')}</strong> expires in about <strong>${daysLeft} days</strong> (${escapeHtml(when)}).`}</p>
    <p><a href="${statusUrl}">View trial status &amp; credentials</a></p>
    <p>To continue after expiry, contact Trialvo to purchase or extend.</p>
  `);

  return { subject, text, html };
}

function wrapHtml(body) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5;color:#111;">${body}</body></html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  trialRequestReceivedEmail,
  trialReadyEmail,
  trialExpiryReminderEmail,
  FRONTEND,
  API_PUBLIC,
};
