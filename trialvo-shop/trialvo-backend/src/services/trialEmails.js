const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { getFrontendUrl, getPublicApiUrl } = require('../config/publicUrls');

const FRONTEND = getFrontendUrl();
const API_PUBLIC = getPublicApiUrl();

const EMAIL_DIR = path.join(__dirname, '..', 'emails');
const cache = new Map();

function loadTemplate(name) {
  if (cache.has(name)) return cache.get(name);
  const filePath = path.join(EMAIL_DIR, name);
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = Handlebars.compile(source);
  cache.set(name, compiled);
  return compiled;
}

function renderEmail(partialName, data) {
  const body = loadTemplate(partialName)(data);
  const html = loadTemplate('layouts/base.hbs')({
    subject: data.subject,
    preheader: data.preheader,
    body,
  });
  return html;
}

function trialRequestReceivedEmail({ name, statusUrl }) {
  const subject = 'Trial request received — Trialvo';
  const text = [
    `Hi ${name},`,
    '',
    'We received your trial request.',
    'If it is approved, open this link for your status and login details:',
    statusUrl,
    '',
    '— Trialvo',
  ].join('\n');

  const html = renderEmail('trial-request-received.hbs', {
    subject,
    preheader: 'We received your trial request',
    name,
    statusUrl,
  });

  return { subject, text, html };
}

function trialReadyEmail({ name, statusUrl, days }) {
  const subject = 'Your Trialvo trial is ready';
  const text = [
    `Hi ${name},`,
    '',
    `Your trial request was approved.${days ? ` Active for ${days} days.` : ''}`,
    'Open your status page for shop/admin links and login credentials:',
    statusUrl,
    '',
    '— Trialvo',
  ].join('\n');

  const html = renderEmail('trial-ready.hbs', {
    subject,
    preheader: 'Your trial is approved',
    name,
    statusUrl,
    days,
  });

  return { subject, text, html };
}

/** Instant demo: credentials go straight into the mail — no approval step to wait for. */
function demoReadyEmail({ name, productName, shopUrl, adminUrl, adminEmail, adminPassword, statusUrl, days, maxMonths, domainTrialUrl }) {
  const subject = `Your live demo is ready — ${productName || 'Trialvo'}`;
  const text = [
    `Hi ${name},`,
    '',
    `Your live demo of ${productName || 'the product'} is ready.${days ? ` Access stays open for ${days} days.` : ''}`,
    '',
    `Storefront: ${shopUrl}`,
    `Admin panel: ${adminUrl}`,
    `Login email: ${adminEmail}`,
    `Password: ${adminPassword}`,
    '',
    `Access page: ${statusUrl}`,
    '',
    `Like it? Run it on your own domain for up to ${maxMonths || 3} months, free: ${domainTrialUrl}`,
    '',
    'Shared demo: other evaluators may see data you enter; demo data resets periodically.',
    '— Trialvo',
  ].join('\n');

  const html = renderEmail('demo-ready.hbs', {
    subject,
    preheader: 'Shop + admin login inside',
    name,
    productName: productName || 'the product',
    shopUrl,
    adminUrl,
    adminEmail,
    adminPassword,
    statusUrl,
    days,
    maxMonths: maxMonths || 3,
    domainTrialUrl,
  });
  return { subject, text, html };
}

/** Own-domain trial: acknowledge + set expectations (SLA, hosting follow-up). */
function domainTrialReceivedEmail({ name, productName, months, domain, hostingSource, hostKind, slaHours, statusUrl }) {
  const buyingHosting = hostingSource === 'buy_from_trialvo';
  const hostKindLabel = hostKind === 'cpanel' ? 'cPanel hosting' : 'VPS';
  const hostingLabel = buyingHosting ? 'Hosting from Trialvo (we will contact you)' : `Your own ${hostKindLabel}`;
  const subject = `Own-domain trial request received — ${productName || 'Trialvo'}`;
  const text = [
    `Hi ${name},`,
    '',
    `We received your request to run ${productName || 'the product'} on your own domain for ${months} month(s), free.`,
    `Domain: ${domain || 'to be decided with hosting'}`,
    `Hosting: ${hostingLabel}`,
    '',
    buyingHosting
      ? 'Next: our team will contact you about hosting options. Once confirmed we deploy and send your login.'
      : `Next: our team will reach out for server access and deploy on your ${hostKindLabel}. Usually within ${slaHours || 24} hours.`,
    '',
    `Track progress: ${statusUrl}`,
    '— Trialvo',
  ].join('\n');

  const html = renderEmail('domain-trial-received.hbs', {
    subject,
    preheader: buyingHosting ? 'We will contact you about hosting' : `Deploying within ${slaHours || 24}h`,
    name,
    productName: productName || 'the product',
    months,
    plural: Number(months) !== 1,
    domain,
    hostingLabel,
    hostKindLabel,
    buyingHosting,
    slaHours: slaHours || 24,
    statusUrl,
  });
  return { subject, text, html };
}

/** Staff fulfilled the domain trial: product is live on the customer's server. */
function domainTrialLiveEmail({ name, productName, shopUrl, adminUrl, adminEmail, expiresAt, notes, statusUrl }) {
  const expiresOn = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { dateStyle: 'long' })
    : 'the end of your trial';
  const subject = `${productName || 'Your product'} is live on your domain`;
  const text = [
    `Hi ${name},`,
    '',
    `${productName || 'Your product'} is now live on your domain. Your free trial runs until ${expiresOn}.`,
    '',
    `Storefront: ${shopUrl}`,
    `Admin panel: ${adminUrl}`,
    adminEmail ? `Admin login: ${adminEmail} (password on your status page)` : '',
    notes ? `\nFrom our team: ${notes}` : '',
    '',
    `Status page: ${statusUrl}`,
    'Buying before the trial ends keeps everything where it is — same server, same data.',
    '— Trialvo',
  ].filter((l) => l !== '').join('\n');

  const html = renderEmail('domain-trial-live.hbs', {
    subject,
    preheader: 'Your own-domain trial is live',
    name,
    productName: productName || 'Your product',
    shopUrl,
    adminUrl,
    adminEmail,
    expiresOn,
    notes,
    statusUrl,
  });
  return { subject, text, html };
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
    'Status page:',
    statusUrl,
    '',
    '— Trialvo',
  ].join('\n');

  const html = renderEmail('trial-expiry-reminder.hbs', {
    subject,
    preheader: urgent ? 'Trial ends soon' : `Expires in ${daysLeft} days`,
    name,
    productName: productName || 'your product',
    statusUrl,
    daysLeft,
    when,
    urgent,
  });

  return { subject, text, html };
}

function trialRejectedEmail({ name, reason }) {
  const subject = 'Trial request update — Trialvo';
  const text = [
    `Hi ${name},`,
    '',
    'Your trial request was not approved at this time.',
    reason ? `Note: ${reason}` : '',
    '',
    '— Trialvo',
  ].filter(Boolean).join('\n');

  const html = renderEmail('trial-rejected.hbs', {
    subject,
    preheader: 'Trial request update',
    name,
    reason: reason || null,
  });

  return { subject, text, html };
}

function paidLicensePackEmail({ name, licenseKey, dockerUrl, cpanelUrl, orderId }) {
  const subject = 'Your Trialvo license & deployment pack';
  const text = [
    `Hi ${name},`,
    '',
    'Thank you for your purchase. Your deployment pack is ready.',
    orderId ? `Order: ${orderId}` : '',
    licenseKey ? `License key (save this — shown once): ${licenseKey}` : '',
    '',
    'Download Docker pack (one-time link):',
    dockerUrl,
    '',
    'Download cPanel / Node pack (one-time link):',
    cpanelUrl,
    '',
    'Each link works once. Need another copy? Contact Trialvo support.',
    'Do not share agent.env. Moving to a new domain requires an approved domain transfer.',
    '',
    '— Trialvo',
  ].filter((l) => l !== '').join('\n');

  const html = [
    `<p>Hi ${escapeHtml(name)},</p>`,
    `<p>Thank you for your purchase. Your deployment pack is ready.</p>`,
    orderId ? `<p><strong>Order:</strong> ${escapeHtml(String(orderId))}</p>` : '',
    licenseKey
      ? `<p><strong>License key</strong> (save this — shown once):<br/><code>${escapeHtml(licenseKey)}</code></p>`
      : '',
    `<p><a href="${escapeHtml(dockerUrl)}">Download Docker pack</a> (one-time)</p>`,
    `<p><a href="${escapeHtml(cpanelUrl)}">Download cPanel / Node pack</a> (one-time)</p>`,
    `<p style="color:#666;font-size:13px">Each link works once. Do not share agent.env. Domain moves need Trialvo admin approval.</p>`,
    `<p>— Trialvo</p>`,
  ].filter(Boolean).join('\n');

  return { subject, text, html };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  trialRequestReceivedEmail,
  trialReadyEmail,
  demoReadyEmail,
  domainTrialReceivedEmail,
  domainTrialLiveEmail,
  trialExpiryReminderEmail,
  trialRejectedEmail,
  paidLicensePackEmail,
  FRONTEND,
  API_PUBLIC,
};
