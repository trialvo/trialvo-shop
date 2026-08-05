"use client";

import { useQuery } from "@tanstack/react-query";
import type { CountryCode } from "libphonenumber-js";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone/countries";
import type { DetectedCountryResult } from "@/lib/phone/types";

async function fetchDetectedCountry(): Promise<DetectedCountryResult> {
  const res = await fetch("/api/geo/country", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return { country: DEFAULT_PHONE_COUNTRY, source: "fallback" };
  }
  const data = (await res.json()) as DetectedCountryResult;
  return {
    country: data.country || DEFAULT_PHONE_COUNTRY,
    source: data.source || "fallback",
  };
}

/**
 * IP / edge-header country for phone defaults (BD fallback).
 */
export function useDetectedCountry(enabled = true): {
  country: CountryCode;
  source: DetectedCountryResult["source"] | "loading";
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ["geo", "country"],
    queryFn: fetchDetectedCountry,
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    country: query.data?.country ?? DEFAULT_PHONE_COUNTRY,
    source: query.isLoading ? "loading" : (query.data?.source ?? "fallback"),
    isLoading: query.isLoading,
  };
}
