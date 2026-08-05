import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone/countries";

/**
 * Build E.164 from country + national digits typed by the user.
 * Empty national input → empty string (country-only UI state).
 */
export function buildPhoneE164(
  nationalInput: string,
  country: CountryCode,
): string {
  const digits = nationalInput.replace(/[^\d+]/g, "");
  if (!digits) return "";

  // If user pasted a full international number, prefer that parse.
  if (digits.startsWith("+") || digits.startsWith("00")) {
    const normalized = digits.startsWith("00")
      ? `+${digits.slice(2)}`
      : digits;
    const parsed = parsePhoneNumberFromString(normalized);
    if (parsed?.isValid()) return parsed.format("E.164");
  }

  const formatter = new AsYouType(country);
  formatter.input(digits.replace(/^\+/, ""));
  const number = formatter.getNumber();
  if (number?.isValid()) return number.format("E.164");
  if (number?.number) return number.format("E.164");

  const callingGuess = parsePhoneNumberFromString(digits, country);
  return callingGuess?.number ?? "";
}

function tryParse(
  raw: string,
  country?: CountryCode,
): PhoneNumber | undefined {
  return country
    ? parsePhoneNumberFromString(raw, country)
    : parsePhoneNumberFromString(raw);
}

/**
 * Parse API / form phone into country + national digits for the input.
 * Supports E.164 (+880…) and local BD (01XXXXXXXXX).
 */
export function parsePhoneValue(
  value: string | null | undefined,
  fallbackCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): {
  country: CountryCode;
  national: string;
  e164: string;
  phoneNumber: PhoneNumber | undefined;
  /** True when a real subscriber number was present (not country-only). */
  hasNumber: boolean;
} {
  const raw = (value ?? "").trim();
  if (!raw) {
    return {
      country: fallbackCountry,
      national: "",
      e164: "",
      phoneNumber: undefined,
      hasNumber: false,
    };
  }

  const digitsOnly = raw.replace(/\D/g, "");

  // 1) International / E.164
  let parsed =
    tryParse(raw) ??
    (raw.startsWith("+") ? undefined : tryParse(raw, fallbackCountry));

  // 2) Common BD local stored without country code
  if (!parsed?.country && /^0?1[3-9]\d{8}$/.test(digitsOnly)) {
    const local = digitsOnly.startsWith("0") ? digitsOnly : `0${digitsOnly}`;
    parsed = tryParse(local, "BD") ?? tryParse(digitsOnly, "BD");
  }

  // 3) Fallback: parse against default country
  if (!parsed) {
    parsed = tryParse(raw, fallbackCountry) ?? tryParse(digitsOnly, fallbackCountry);
  }

  if (parsed?.country || parsed?.nationalNumber) {
    const country = parsed.country ?? fallbackCountry;
    const national = parsed.nationalNumber || "";
    const e164 =
      parsed.isValid() && parsed.number
        ? parsed.format("E.164")
        : parsed.number || "";

    return {
      country,
      national,
      e164,
      phoneNumber: parsed,
      hasNumber: national.length > 0,
    };
  }

  // Unparseable — do not dump raw junk into the number field
  return {
    country: fallbackCountry,
    national: "",
    e164: "",
    phoneNumber: undefined,
    hasNumber: false,
  };
}

export function formatNationalDisplay(
  nationalDigits: string,
  country: CountryCode,
): string {
  if (!nationalDigits) return "";
  const formatter = new AsYouType(country);
  return formatter.input(nationalDigits);
}

export function isValidPhoneE164(
  value: string,
  defaultCountry?: CountryCode,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const parsed =
    parsePhoneNumberFromString(trimmed) ??
    (defaultCountry
      ? parsePhoneNumberFromString(trimmed, defaultCountry)
      : undefined);
  return Boolean(parsed?.isValid());
}

/**
 * Adapt E.164 for shop APIs that historically expect BD local (01XXXXXXXXX).
 * Non-BD numbers stay E.164.
 */
export function toApiPhoneNumber(e164OrRaw: string): string {
  const parsed = parsePhoneNumberFromString(e164OrRaw.trim());
  if (!parsed?.isValid()) {
    const digits = e164OrRaw.replace(/\D/g, "");
    if (/^01[3-9]\d{8}$/.test(digits)) return digits;
    return e164OrRaw.trim();
  }
  if (parsed.country === "BD") {
    return `0${parsed.nationalNumber}`;
  }
  return parsed.format("E.164");
}

export function getPhonePlaceholder(country: CountryCode): string {
  switch (country) {
    case "BD":
      return "01712 345678";
    case "US":
    case "CA":
      return "(201) 555-0123";
    case "GB":
      return "07400 123456";
    case "IN":
      return "98765 43210";
    default:
      return "Phone number";
  }
}
