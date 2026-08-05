/**
 * Google Tag Manager helper.
 *
 * ARCHITECTURE — GTM IS THE SINGLE SOURCE OF TRUTH:
 * ─────────────────────────────────────────────────
 * All analytics events (FB Pixel, GA4, etc.) are fired THROUGH GTM's dataLayer.
 * This file is the ONLY place in the codebase that writes to window.dataLayer.
 *
 * WHY THIS APPROACH:
 * - Fixes the double-counting bug (FB Pixel + GA4 were fired directly AND via GTM)
 * - GTM handles consent, tag ordering, and version rollback without code deploys
 * - Follows the GA4 enhanced ecommerce documentation exactly
 *
 * ECOMMERCE CLEAR PATTERN:
 * pushEcommerceEvent() always pushes { ecommerce: null } FIRST.
 * Without this, GTM bleeds product data from the previous event into the next one.
 *
 * SCRIPT LOADING:
 * The GTM script itself is loaded by next/script in layout.tsx (afterInteractive).
 * initGTM() only sets up the dataLayer array and the gtm.start event.
 */

import type { DataLayerEvent, GoogleTagManagerConfig } from "./types";

// Access dataLayer without augmenting Window to avoid conflicts with
// google-analytics.ts which declares dataLayer as unknown[].
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dl(): any[] | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!Array.isArray(w.dataLayer)) {
    w.dataLayer = [];
  }
  return w.dataLayer;
}

/* ── Internal state ────────────────────────────────────────── */

let gtmInitialised = false;

/* ── Event ID Generator ────────────────────────────────────── */

/**
 * Generates a unique event ID for FB CAPI deduplication.
 * Uses crypto.randomUUID() when available (all modern browsers), with a
 * timestamp+random fallback for older browsers.
 *
 * USAGE: Generate ONE event_id per user action and share it with:
 *   1. The dataLayer push (browser Pixel via GTM)
 *   2. The API call body (for server-side CAPI)
 * Both sides must use the EXACT same event_id for Meta to deduplicate.
 */
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/* ── Initialization ────────────────────────────────────────── */

/**
 * Sets up window.dataLayer and pushes the gtm.start event.
 * The GTM <script> tag is rendered by next/script in layout.tsx — NOT here.
 * AnalyticsProvider calls this once after config is loaded.
 */
export function initGTM(config: GoogleTagManagerConfig): void {
  if (typeof window === "undefined") return;
  if (!config.enabled || !config.gtm_id) return;
  if (gtmInitialised) return;

  try {
    gtmInitialised = true;
    const dataLayer = dl();
    if (!dataLayer) return;

    // Push the gtm.start event — GTM reads this to confirm it's present
    dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
  } catch (err) {
    console.warn("[Analytics] GTM init failed:", err);
    gtmInitialised = false;
  }
}

/* ── Generic Data Layer Push ───────────────────────────────── */

/**
 * Push any arbitrary object to window.dataLayer.
 * Use pushEcommerceEvent() for all ecommerce events.
 */
export function pushDataLayer(data: Record<string, unknown>): void {
  try {
    dl()?.push(data);
  } catch {
    /* noop */
  }
}

/* ── Ecommerce Event Push ──────────────────────────────────── */

/**
 * Push an ecommerce event to the GTM data layer.
 *
 * ALWAYS clears `ecommerce: null` before the real push — this is REQUIRED
 * by GA4 to prevent product data from bleeding between sequential events.
 *
 * GTM fires all configured tags (FB Pixel, GA4, etc.) from this push.
 *
 * @param eventName - GTM trigger name (e.g. 'purchase', 'add_to_cart')
 * @param data      - Event data (without 'event' field — that's eventName)
 */
export function pushEcommerceEvent(
  eventName: string,
  data: Omit<DataLayerEvent, "event">,
): void {
  try {
    const dataLayer = dl();
    if (!dataLayer) return;

    // REQUIRED: Clear previous ecommerce object before each push
    dataLayer.push({ ecommerce: null });

    // Push the actual event
    dataLayer.push({ event: eventName, ...data });
  } catch {
    /* noop */
  }
}

/* ── User Context Push ─────────────────────────────────────── */

/**
 * Push user context to dataLayer — available to all subsequent GTM tag firings.
 * Call when auth state changes so tags have user_logged_in and hashed PII.
 */
export function pushUserContext(data: {
  user_logged_in: boolean;
  user_data?: {
    em?: string;           // SHA-256 hashed email
    ph?: string;           // SHA-256 hashed phone
    external_id?: string;  // SHA-256 hashed user ID
  };
}): void {
  try {
    dl()?.push(data);
  } catch {
    /* noop */
  }
}

/**
 * Clear the ecommerce object between events.
 * Google recommends calling this before each ecommerce push to prevent
 * data from previous events bleeding into the next one.
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */
export function clearEcommerce(): void {
  pushDataLayer({ ecommerce: null });
}
