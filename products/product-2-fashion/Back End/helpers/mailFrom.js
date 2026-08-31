/**
 * Resolve the RFC-5322 From header.
 * Falls back to the SMTP username so existing cPanel/Brevo installs
 * (which have no MAIL_FROM row) behave exactly as before.
 */
function resolveFrom(cfg, brandName) {
  const fromRaw = cfg && cfg.MAIL_FROM != null ? String(cfg.MAIL_FROM).trim() : "";
  const userRaw = cfg && cfg.MAIL_USER != null ? String(cfg.MAIL_USER).trim() : "";
  const address = fromRaw || userRaw;

  // Do not emit a malformed `"Name" <>` header when both addresses are empty.
  if (!address) return address;

  const nameRaw = cfg && cfg.MAIL_FROM_NAME != null ? String(cfg.MAIL_FROM_NAME).trim() : "";
  const displayName = nameRaw || (brandName != null ? String(brandName) : "");
  if (!displayName) return address;

  const escaped = displayName.replace(/"/g, '\\"');
  return `"${escaped}" <${address}>`;
}

module.exports = { resolveFrom };
