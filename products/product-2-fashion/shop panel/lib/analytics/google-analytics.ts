/**
 * @deprecated
 * google-analytics.ts is DEPRECATED — do not use directly.
 *
 * GA4 events are now fired via GTM's dataLayer:
 *   pushEcommerceEvent("purchase", { ecommerce: { items: [...], value: 50 } })
 *
 * GTM reads the dataLayer push and fires a GA4 Event tag automatically.
 * This way GA4, FB Pixel, and any other tags are all managed in GTM — not here.
 *
 * The gtag/dataLayer declarations are kept here for TypeScript compatibility
 * since other files (gtm.ts) reference window.dataLayer.
 */

/* ── Global declarations (kept for TypeScript compatibility) ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Gtag = (...args: any[]) => void;

declare global {
  interface Window {
    gtag: Gtag;
    dataLayer: unknown[];
  }
}

export { };

