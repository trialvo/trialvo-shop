import { COUNTRIES } from "./countries";

export type CountryDetectionSource =
  | "header"
  | "accept-language"
  | "timezone"
  | "locale"
  | "none";

export type CountryDetectionResponse = {
  countryCode: string | null;
  source: CountryDetectionSource;
};

const SUPPORTED_COUNTRY_CODES = new Set(COUNTRIES.map((country) => country.code));

const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "America/Argentina/Buenos_Aires": "AR",
  "America/Bogota": "CO",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/New_York": "US",
  "America/Phoenix": "US",
  "America/Santiago": "CL",
  "America/Sao_Paulo": "BR",
  "America/Toronto": "CA",
  "Asia/Baghdad": "IQ",
  "Asia/Bahrain": "BH",
  "Asia/Bangkok": "TH",
  "Asia/Dhaka": "BD",
  "Asia/Dubai": "AE",
  "Asia/Hong_Kong": "HK",
  "Asia/Jakarta": "ID",
  "Asia/Jerusalem": "IL",
  "Asia/Karachi": "PK",
  "Asia/Kathmandu": "NP",
  "Asia/Kolkata": "IN",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Kuwait": "KW",
  "Asia/Manila": "PH",
  "Asia/Muscat": "OM",
  "Asia/Qatar": "QA",
  "Asia/Riyadh": "SA",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Singapore": "SG",
  "Asia/Taipei": "TW",
  "Asia/Tehran": "IR",
  "Asia/Tokyo": "JP",
  "Australia/Sydney": "AU",
  "Europe/Amsterdam": "NL",
  "Europe/Berlin": "DE",
  "Europe/Brussels": "BE",
  "Europe/Dublin": "IE",
  "Europe/Helsinki": "FI",
  "Europe/Istanbul": "TR",
  "Europe/Lisbon": "PT",
  "Europe/London": "GB",
  "Europe/Madrid": "ES",
  "Europe/Moscow": "RU",
  "Europe/Oslo": "NO",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Stockholm": "SE",
  "Europe/Warsaw": "PL",
  "Europe/Zurich": "CH",
  "Pacific/Auckland": "NZ",
};

export function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;

  return SUPPORTED_COUNTRY_CODES.has(code) ? code : null;
}

export function detectCountryFromAcceptLanguage(value: string | null): string | null {
  if (!value) return null;

  for (const language of value.split(",")) {
    const countryCode = detectCountryFromLocale(language.split(";")[0]?.trim());
    if (countryCode) return countryCode;
  }

  return null;
}

export function detectCountryFromLocale(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = value.replace(/_/g, "-");
  const segments = normalized.split("-").filter(Boolean);

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const countryCode = normalizeCountryCode(segments[index]);
    if (countryCode) return countryCode;
  }

  return null;
}

export function detectCountryFromTimeZone(value: string | null | undefined): string | null {
  if (!value) return null;

  return normalizeCountryCode(TIMEZONE_COUNTRY_MAP[value]) ?? null;
}
