export type {
  PhoneCountryOption,
  DetectedCountryResult,
  PhoneE164,
} from "@/lib/phone/types";
export {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountries,
  findPhoneCountry,
  isPhoneCountryCode,
  countryFlagEmoji,
} from "@/lib/phone/countries";
export {
  buildPhoneE164,
  parsePhoneValue,
  formatNationalDisplay,
  isValidPhoneE164,
  toApiPhoneNumber,
  getPhonePlaceholder,
} from "@/lib/phone/parse";
export { phoneSchema, optionalPhoneSchema } from "@/lib/phone/schema";
