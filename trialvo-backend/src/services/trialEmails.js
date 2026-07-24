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

module.exports = {
  trialRequestReceivedEmail,
  trialReadyEmail,
  trialExpiryReminderEmail,
  trialRejectedEmail,
  FRONTEND,
  API_PUBLIC,
};
