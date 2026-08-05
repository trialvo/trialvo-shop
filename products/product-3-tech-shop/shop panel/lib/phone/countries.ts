import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import type { PhoneCountryOption } from "@/lib/phone/types";

/** Fallback when IP / headers cannot resolve a country. */
export const DEFAULT_PHONE_COUNTRY: CountryCode = "BD";

const REGION_NAMES =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryFlagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return code.replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0)),
  );
}

export function countryDisplayName(iso2: CountryCode): string {
  return REGION_NAMES?.of(iso2) ?? iso2;
}

export function isPhoneCountryCode(value: string): value is CountryCode {
  return getCountries().includes(value as CountryCode);
}

function toOption(iso2: CountryCode): PhoneCountryOption {
  return {
    iso2,
    name: countryDisplayName(iso2),
    dialCode: `+${getCountryCallingCode(iso2)}`,
    flag: countryFlagEmoji(iso2),
  };
}

let cachedCountries: PhoneCountryOption[] | null = null;

/**
 * Full country list for the picker — A–Z by name (searchable).
 */
export function getPhoneCountries(): PhoneCountryOption[] {
  if (cachedCountries) return cachedCountries;

  cachedCountries = getCountries()
    .map(toOption)
    .sort((a, b) => a.name.localeCompare(b.name));

  return cachedCountries;
}

export function findPhoneCountry(
  iso2: CountryCode | string | null | undefined,
): PhoneCountryOption | undefined {
  if (!iso2 || !isPhoneCountryCode(iso2)) return undefined;
  return getPhoneCountries().find((c) => c.iso2 === iso2);
}
