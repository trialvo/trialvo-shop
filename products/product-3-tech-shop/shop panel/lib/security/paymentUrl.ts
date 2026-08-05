/**
 * Validate payment-gateway redirect URLs before navigating away.
 * Blocks javascript:/data: and non-http(s) schemes; optional host allowlist via env.
 */

const DANGEROUS = /^(javascript|data|vbscript|file):/i;

export function sanitizePaymentRedirectUrl(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed || DANGEROUS.test(trimmed) || trimmed.startsWith("//")) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  // Production: prefer HTTPS only
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:"
  ) {
    return null;
  }

  return url.toString();
}
