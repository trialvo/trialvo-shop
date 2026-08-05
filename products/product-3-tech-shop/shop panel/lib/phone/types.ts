import type { CountryCode } from "libphonenumber-js";

export type PhoneCountryOption = {
  iso2: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
};

export type DetectedCountryResult = {
  country: CountryCode;
  source: "header" | "ip" | "fallback";
};

/** Form field value — always E.164 when valid (e.g. +8801712345678). */
export type PhoneE164 = string;
