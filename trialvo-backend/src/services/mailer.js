const { getSmtpConfig, formatFromAddress } = require('./smtpSettings');

async function createTransporter(cfg) {
  let nodemailer;
  try {
    nodemailer = require('nodemailer');
  } catch {
    return null;
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
  });
}

// Sends email when SMTP is enabled in system_config; otherwise logs to console.
async function sendMail({ to, subject, text, html }) {
  const cfg = await getSmtpConfig();

  if (!cfg.enabled || !cfg.host) {
    console.log(`[mailer:stub] To: ${to} | ${subject}\n${text || html || ''}`);
    return { ok: true, stub: true };
  }

  const transporter = await createTransporter(cfg);
  if (!transporter) {
    console.log(`[mailer:stub] nodemailer not installed. To: ${to} | ${subject}`);
    return { ok: true, stub: true };
  }

  await transporter.sendMail({
    from: formatFromAddress(cfg),
    to,
    subject,
    text,
    html,
  });

  return { ok: true };
}

/** Send a test message using provided config or current DB settings. */
async function sendTestMail({ to, cfg }) {
  const settings = cfg || await getSmtpConfig();

  if (!settings.host) {
    throw new Error('SMTP host is required');
  }

  const transporter = await createTransporter(settings);
  if (!transporter) {
    throw new Error('nodemailer is not installed');
  }

  await transporter.verify();

  await transporter.sendMail({
    from: formatFromAddress(settings),
    to,
    subject: 'Trialvo Shop — SMTP test',
    text: 'This is a test email from your Trialvo Shop admin panel. SMTP is working correctly.',
    html: '<p>This is a test email from your <strong>Trialvo Shop</strong> admin panel. SMTP is working correctly.</p>',
  });

  return { ok: true };
}

module.exports = { sendMail, sendTestMail, createTransporter };
