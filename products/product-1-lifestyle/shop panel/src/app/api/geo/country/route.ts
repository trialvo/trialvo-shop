import { NextResponse, type NextRequest } from "next/server";

import {
  detectCountryFromAcceptLanguage,
  normalizeCountryCode,
  type CountryDetectionResponse,
} from "@/components/ui/PhoneInput/countryDetection";

const COUNTRY_HEADER_CANDIDATES = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-client-country",
  "x-geo-country",
];

export function GET(request: NextRequest) {
  const countryFromHeader = getCountryFromHeaders(request);
  const countryFromAcceptLanguage = detectCountryFromAcceptLanguage(
    request.headers.get("accept-language"),
  );

  const body: CountryDetectionResponse = countryFromHeader
    ? { countryCode: countryFromHeader, source: "header" }
    : countryFromAcceptLanguage
      ? { countryCode: countryFromAcceptLanguage, source: "accept-language" }
      : { countryCode: null, source: "none" };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function getCountryFromHeaders(request: NextRequest): string | null {
  for (const headerName of COUNTRY_HEADER_CANDIDATES) {
    const countryCode = normalizeCountryCode(request.headers.get(headerName));
    if (countryCode) return countryCode;
  }

  return null;
}
