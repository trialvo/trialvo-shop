"use client";

import { useEffect, useState } from "react";

import {
  detectCountryFromLocale,
  detectCountryFromTimeZone,
  normalizeCountryCode,
  type CountryDetectionResponse,
} from "./countryDetection";

export function useDetectedCountryCode(enabled: boolean): string | null {
  const [countryCode, setCountryCode] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const localCountryCode = detectCountryFromBrowser();
    if (localCountryCode) setCountryCode(localCountryCode);

    void fetch("/api/geo/country", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as CountryDetectionResponse;
      })
      .then((payload) => {
        if (cancelled) return;

        const detectedCountryCode = normalizeCountryCode(payload?.countryCode);
        if (!detectedCountryCode) return;
        if (payload?.source === "header" || !localCountryCode) {
          setCountryCode(detectedCountryCode);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return countryCode;
}

function detectCountryFromBrowser(): string | null {
  const timezoneCountryCode = detectCountryFromTimeZone(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  if (timezoneCountryCode) return timezoneCountryCode;

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of languages) {
    const countryCode = detectCountryFromLocale(language);
    if (countryCode) return countryCode;
  }

  return null;
}
