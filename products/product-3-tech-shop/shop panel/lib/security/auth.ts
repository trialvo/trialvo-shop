/**
 * Auth input sanitization — strips control chars / injection probes
 * before validation and API submission.
 */

export function sanitizeAuthText(raw: string, maxLength = 120): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .normalize("NFKC")
    .replace(/[<>`]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(raw: string): string {
  return sanitizeAuthText(raw, 254).toLowerCase();
}

/** Normalize BD mobile to 01XXXXXXXXX (local) when possible */
export function normalizeBdMobile(raw: string): string {
  const digits = sanitizeAuthText(raw, 20).replace(/[^\d+]/g, "");
  const cleaned = digits.replace(/^\+?88/, "");
  return cleaned;
}

export function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isBdMobileLike(value: string): boolean {
  return /^01[3-9]\d{8}$/.test(normalizeBdMobile(value));
}

export function sanitizeOtp(raw: string): string {
  return sanitizeAuthText(raw, 8).replace(/\D/g, "").slice(0, 6);
}

/**
 * Split "email or mobile" into the payload shape expected by forgot-password APIs.
 */
export function toForgotPasswordPayload(emailOrMobile: string): {
  email?: string;
  phone_number?: string;
  method: "email" | "sms";
} {
  const value = sanitizeAuthText(emailOrMobile, 254);
  if (isEmailLike(value)) {
    return { email: sanitizeEmail(value), method: "email" };
  }
  const phone = normalizeBdMobile(value);
  return { phone_number: phone, method: "sms" };
}
