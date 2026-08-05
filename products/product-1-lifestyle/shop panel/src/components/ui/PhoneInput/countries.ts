export interface Country {
  code: string;
  name: string;
  dialCode: string;
  maxLength: number;
}

export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan",            dialCode: "+93",  maxLength: 9  },
  { code: "AL", name: "Albania",                dialCode: "+355", maxLength: 9  },
  { code: "DZ", name: "Algeria",                dialCode: "+213", maxLength: 9  },
  { code: "AR", name: "Argentina",              dialCode: "+54",  maxLength: 10 },
  { code: "AU", name: "Australia",              dialCode: "+61",  maxLength: 9  },
  { code: "AT", name: "Austria",                dialCode: "+43",  maxLength: 10 },
  { code: "AZ", name: "Azerbaijan",             dialCode: "+994", maxLength: 9  },
  { code: "BH", name: "Bahrain",                dialCode: "+973", maxLength: 8  },
  { code: "BD", name: "Bangladesh",             dialCode: "+880", maxLength: 10 },
  { code: "BE", name: "Belgium",                dialCode: "+32",  maxLength: 9  },
  { code: "BR", name: "Brazil",                 dialCode: "+55",  maxLength: 11 },
  { code: "BN", name: "Brunei",                 dialCode: "+673", maxLength: 7  },
  { code: "BG", name: "Bulgaria",               dialCode: "+359", maxLength: 9  },
  { code: "CA", name: "Canada",                 dialCode: "+1",   maxLength: 10 },
  { code: "CL", name: "Chile",                  dialCode: "+56",  maxLength: 9  },
  { code: "CN", name: "China",                  dialCode: "+86",  maxLength: 11 },
  { code: "CO", name: "Colombia",               dialCode: "+57",  maxLength: 10 },
  { code: "HR", name: "Croatia",                dialCode: "+385", maxLength: 9  },
  { code: "CY", name: "Cyprus",                 dialCode: "+357", maxLength: 8  },
  { code: "CZ", name: "Czech Republic",         dialCode: "+420", maxLength: 9  },
  { code: "DK", name: "Denmark",                dialCode: "+45",  maxLength: 8  },
  { code: "EG", name: "Egypt",                  dialCode: "+20",  maxLength: 10 },
  { code: "ET", name: "Ethiopia",               dialCode: "+251", maxLength: 9  },
  { code: "FI", name: "Finland",                dialCode: "+358", maxLength: 10 },
  { code: "FR", name: "France",                 dialCode: "+33",  maxLength: 9  },
  { code: "GE", name: "Georgia",                dialCode: "+995", maxLength: 9  },
  { code: "DE", name: "Germany",                dialCode: "+49",  maxLength: 11 },
  { code: "GH", name: "Ghana",                  dialCode: "+233", maxLength: 9  },
  { code: "GR", name: "Greece",                 dialCode: "+30",  maxLength: 10 },
  { code: "HK", name: "Hong Kong",              dialCode: "+852", maxLength: 8  },
  { code: "HU", name: "Hungary",                dialCode: "+36",  maxLength: 9  },
  { code: "IN", name: "India",                  dialCode: "+91",  maxLength: 10 },
  { code: "ID", name: "Indonesia",              dialCode: "+62",  maxLength: 12 },
  { code: "IR", name: "Iran",                   dialCode: "+98",  maxLength: 10 },
  { code: "IQ", name: "Iraq",                   dialCode: "+964", maxLength: 10 },
  { code: "IE", name: "Ireland",                dialCode: "+353", maxLength: 9  },
  { code: "IL", name: "Israel",                 dialCode: "+972", maxLength: 9  },
  { code: "IT", name: "Italy",                  dialCode: "+39",  maxLength: 10 },
  { code: "JP", name: "Japan",                  dialCode: "+81",  maxLength: 11 },
  { code: "JO", name: "Jordan",                 dialCode: "+962", maxLength: 9  },
  { code: "KZ", name: "Kazakhstan",             dialCode: "+7",   maxLength: 10 },
  { code: "KE", name: "Kenya",                  dialCode: "+254", maxLength: 9  },
  { code: "KR", name: "South Korea",            dialCode: "+82",  maxLength: 11 },
  { code: "KW", name: "Kuwait",                 dialCode: "+965", maxLength: 8  },
  { code: "LB", name: "Lebanon",                dialCode: "+961", maxLength: 8  },
  { code: "LY", name: "Libya",                  dialCode: "+218", maxLength: 9  },
  { code: "MY", name: "Malaysia",               dialCode: "+60",  maxLength: 10 },
  { code: "MV", name: "Maldives",               dialCode: "+960", maxLength: 7  },
  { code: "MA", name: "Morocco",                dialCode: "+212", maxLength: 9  },
  { code: "MM", name: "Myanmar",                dialCode: "+95",  maxLength: 9  },
  { code: "NP", name: "Nepal",                  dialCode: "+977", maxLength: 10 },
  { code: "NL", name: "Netherlands",            dialCode: "+31",  maxLength: 9  },
  { code: "NZ", name: "New Zealand",            dialCode: "+64",  maxLength: 9  },
  { code: "NG", name: "Nigeria",                dialCode: "+234", maxLength: 10 },
  { code: "NO", name: "Norway",                 dialCode: "+47",  maxLength: 8  },
  { code: "OM", name: "Oman",                   dialCode: "+968", maxLength: 8  },
  { code: "PK", name: "Pakistan",               dialCode: "+92",  maxLength: 10 },
  { code: "PE", name: "Peru",                   dialCode: "+51",  maxLength: 9  },
  { code: "PH", name: "Philippines",            dialCode: "+63",  maxLength: 10 },
  { code: "PL", name: "Poland",                 dialCode: "+48",  maxLength: 9  },
  { code: "PT", name: "Portugal",               dialCode: "+351", maxLength: 9  },
  { code: "QA", name: "Qatar",                  dialCode: "+974", maxLength: 8  },
  { code: "RO", name: "Romania",                dialCode: "+40",  maxLength: 9  },
  { code: "RU", name: "Russia",                 dialCode: "+7",   maxLength: 10 },
  { code: "SA", name: "Saudi Arabia",           dialCode: "+966", maxLength: 9  },
  { code: "SN", name: "Senegal",                dialCode: "+221", maxLength: 9  },
  { code: "SG", name: "Singapore",              dialCode: "+65",  maxLength: 8  },
  { code: "ZA", name: "South Africa",           dialCode: "+27",  maxLength: 9  },
  { code: "ES", name: "Spain",                  dialCode: "+34",  maxLength: 9  },
  { code: "LK", name: "Sri Lanka",              dialCode: "+94",  maxLength: 9  },
  { code: "SD", name: "Sudan",                  dialCode: "+249", maxLength: 9  },
  { code: "SE", name: "Sweden",                 dialCode: "+46",  maxLength: 9  },
  { code: "CH", name: "Switzerland",            dialCode: "+41",  maxLength: 9  },
  { code: "TW", name: "Taiwan",                 dialCode: "+886", maxLength: 9  },
  { code: "TZ", name: "Tanzania",               dialCode: "+255", maxLength: 9  },
  { code: "TH", name: "Thailand",               dialCode: "+66",  maxLength: 9  },
  { code: "TN", name: "Tunisia",                dialCode: "+216", maxLength: 8  },
  { code: "TR", name: "Turkey",                 dialCode: "+90",  maxLength: 10 },
  { code: "UG", name: "Uganda",                 dialCode: "+256", maxLength: 9  },
  { code: "UA", name: "Ukraine",                dialCode: "+380", maxLength: 9  },
  { code: "AE", name: "United Arab Emirates",   dialCode: "+971", maxLength: 9  },
  { code: "GB", name: "United Kingdom",         dialCode: "+44",  maxLength: 10 },
  { code: "US", name: "United States",          dialCode: "+1",   maxLength: 10 },
  { code: "VN", name: "Vietnam",                dialCode: "+84",  maxLength: 10 },
  { code: "YE", name: "Yemen",                  dialCode: "+967", maxLength: 9  },
];

export function getFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

/**
 * Find the best-matching country for a number that starts with "+".
 * Tries longest dial-code first so "+1868" matches TT before US (+1).
 */
export function findCountryByNumber(phone: string, preferredCode?: string): Country | undefined {
  if (!phone.startsWith("+")) return undefined;
  const matches = [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .filter((c) => phone.startsWith(c.dialCode));

  return matches.find((country) => country.code === preferredCode) ?? matches[0];
}

export function formatDigits(digits: string, maxLength: number): string {
  const d = digits.slice(0, maxLength);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)} ${d.slice(10)}`;
}
