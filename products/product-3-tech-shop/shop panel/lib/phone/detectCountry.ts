import {
  DEFAULT_PHONE_COUNTRY,
  isPhoneCountryCode,
} from "@/lib/phone/countries";
import type { DetectedCountryResult } from "@/lib/phone/types";
import type { CountryCode } from "libphonenumber-js";

function readCountryHeader(headers: Headers): string | null {
  const candidates = [
    headers.get("cf-ipcountry"),
    headers.get("x-vercel-ip-country"),
    headers.get("cloudfront-viewer-country"),
    headers.get("x-country-code"),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const code = raw.trim().toUpperCase();
    if (code && code !== "XX" && code !== "T1" && isPhoneCountryCode(code)) {
      return code;
    }
  }
  return null;
}

function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  return realIp || null;
}

/**
 * Resolve visitor country for phone defaulting.
 * Order: CDN geo headers → optional IP lookup → BD fallback.
 */
export async function detectCountryFromRequest(
  headers: Headers,
): Promise<DetectedCountryResult> {
  const fromHeader = readCountryHeader(headers);
  if (fromHeader) {
    return { country: fromHeader as CountryCode, source: "header" };
  }

  const ip = clientIpFromHeaders(headers);
  if (ip && ip !== "127.0.0.1" && ip !== "::1") {
    try {
      const url = `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(2500),
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          success?: boolean;
          country_code?: string;
        };
        const code = data.country_code?.toUpperCase();
        if (data.success && code && isPhoneCountryCode(code)) {
          return { country: code, source: "ip" };
        }
      }
    } catch {
      // fall through to default
    }
  }

  return { country: DEFAULT_PHONE_COUNTRY, source: "fallback" };
}
