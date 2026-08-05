/**
 * @deprecated
 * facebook-pixel.ts is DEPRECATED — do not use directly.
 *
 * All Facebook Pixel events are now fired via GTM's dataLayer:
 *   pushEcommerceEvent("purchase", { ecommerce: { ... }, event_id: "..." })
 *
 * GTM reads the dataLayer push and fires the FB Pixel tag automatically.
 * This keeps all platform SDKs managed in ONE place (GTM) and eliminates
 * the double-counting bug that occurred when both this file AND GTM fired events.
 *
 * To configure the FB Pixel tag, see the GTM setup guide in walkthrough.md.
 */

// This file is intentionally left with only type exports.
// No fbq() calls are made from application code.

export { };

