"use client";

/**
 * useCookieIds — reads browser cookie IDs for Facebook CAPI handoff.
 *
 * These cookie values are created by the Facebook Pixel SDK and need to be
 * passed to the server API on order creation, so the server-side CAPI
 * call can include them for proper attribution and deduplication.
 *
 * HOW TO USE:
 *   const { fbp, fbc } = useCookieIds();
 *   createOrder({ ..., fbp, fbc, capi_event_id: eventId });
 *
 * COOKIES:
 *   _fbp  — Set by the FB Pixel on your domain. Used for attribution.
 *            Format: fb.1.{timestamp}.{randomId}
 *   _fbc  — Set when a user arrives via a Facebook ad (?fbclid=...).
 *            Format: fb.1.{timestamp}.{fbclid}
 *   _ga   — Google Analytics client ID (used for GA4 attribution).
 *            Format: GA1.1.{clientId}.{timestamp}
 */

import type { CookieIds } from "@/lib/analytics/types";
import { useMemo } from "react";

/* ── Cookie reader ─────────────────────────────────────────── */

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Extracts the GA4 client ID from the _ga cookie.
 * The _ga cookie format is "GA1.1.{client_id}.{timestamp}",
 * so we strip the "GA1.1." prefix to get the raw client ID.
 */
function getGaClientId(gaCookie: string | null): string | null {
  if (!gaCookie) return null;
  const parts = gaCookie.split(".");
  // GA cookie format: GA1.1.XXXXXXXXXX.XXXXXXXXXX
  if (parts.length >= 4) return parts.slice(2).join(".");
  return gaCookie;
}

/* ── Hook ──────────────────────────────────────────────────── */

/**
 * Returns the browser cookie IDs needed for Facebook CAPI.
 * Values are memoized — won't re-compute on every render.
 *
 * Returns null for each field if the cookie doesn't exist
 * (e.g. user has ad-blocker, hasn't clicked a FB ad, etc.).
 */
export function useCookieIds(): CookieIds {
  return useMemo<CookieIds>(() => {
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");
    const gaCookie = getCookie("_ga");
    const ga_client_id = getGaClientId(gaCookie);

    return { fbp, fbc, ga_client_id };
  }, []); // Read once on mount — cookies don't change during a session
}
