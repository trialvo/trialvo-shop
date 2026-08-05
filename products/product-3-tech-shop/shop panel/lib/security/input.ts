/**
 * Input sanitizers for AppInput — strip control chars / injection probes
 * before values enter React state or leave the UI layer.
 */

export type InputSanitizeMode =
  | "none"
  | "text"
  | "email"
  | "phone"
  | "number"
  | "otp"
  | "search"
  | "password";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const DANGEROUS_CHARS = /[<>`]/g;

export function sanitizeInputValue(
  raw: string,
  mode: InputSanitizeMode = "text",
  maxLength = 500,
): string {
  if (typeof raw !== "string") return "";

  let value = raw.normalize("NFKC").replace(CONTROL_CHARS, "");

  switch (mode) {
    case "none":
    case "password":
      // Passwords: only strip control chars — do not alter content
      break;
    case "email":
      value = value.replace(DANGEROUS_CHARS, "").trim().toLowerCase();
      break;
    case "phone":
      value = value.replace(/[^\d+\s-]/g, "");
      break;
    case "number":
      value = value.replace(/[^\d.-]/g, "");
      break;
    case "otp":
      value = value.replace(/\D/g, "");
      break;
    case "search":
      value = value.replace(DANGEROUS_CHARS, "").replace(/[^\w\s\u0980-\u09FF.-]/g, "");
      break;
    case "text":
    default:
      value = value.replace(DANGEROUS_CHARS, "");
      break;
  }

  return value.slice(0, Math.max(1, maxLength));
}

/** Sensible max lengths by sanitize mode (security + UX) */
export function defaultMaxLengthForMode(mode: InputSanitizeMode): number {
  switch (mode) {
    case "otp":
      return 6;
    case "phone":
      return 20;
    case "email":
      return 254;
    case "password":
      return 64;
    case "search":
      return 100;
    case "number":
      return 16;
    default:
      return 500;
  }
}

/** Infer sanitize mode from HTML input type when not provided */
export function inferSanitizeMode(
  type: string | undefined,
): InputSanitizeMode {
  switch (type) {
    case "email":
      return "email";
    case "tel":
      return "phone";
    case "number":
      return "number";
    case "password":
      return "password";
    case "search":
      return "search";
    default:
      return "text";
  }
}
