/**
 * Shared nodemailer transport options so SES/SMTP cannot hang past the shop BFF timeout.
 */
function smtpTransportOptions(cfg) {
  const port = parseInt(cfg.MAIL_PORT || cfg.EMAIL_PORT || 587, 10) || 587;
  const secure =
    String(cfg.MAIL_SECURE || cfg.EMAIL_SECURE || (port === 465 ? "true" : "false")) ===
    "true";
  const user = cfg.MAIL_USER || cfg.EMAIL_USER;
  const pass = cfg.MAIL_PASS || cfg.EMAIL_PASS;
  const host = cfg.MAIL_HOST || cfg.EMAIL_HOST;

  return {
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  };
}

module.exports = { smtpTransportOptions };
