"use client";

/**
 * useAnalytics — Unified analytics hook.
 *
 * ALL events push to window.dataLayer via GTM (pushEcommerceEvent).
 * GTM fires all platform tags (FB Pixel, GA4, etc.) from your container.
 *
 * DEDUPLICATION PATTERN (Purchase):
 *   const eventId = generateEventId();     // 1. Generate BEFORE creating order
 *   trackPurchase({ ..., event_id: eventId }); // 2. Fire via GTM to browser Pixel
 *   createOrder({ ..., capi_event_id: eventId }); // 3. API uses same ID for CAPI
 *   // → Meta sees both hits with same event_id → deduplicates → counts as 1
 */

import { useCallback } from "react";
import { useAnalyticsConfig } from "./AnalyticsProvider";
import { generateEventId, pushDataLayer, pushEcommerceEvent } from "./gtm";
import type {
  AddToCartPayload,
  DataLayerItem,
  InitiateCheckoutPayload,
  PurchasePayload,
  RemoveFromCartPayload,
  ViewCartPayload,
  ViewContentPayload,
} from "./types";

// Re-export for caller convenience — they can import generateEventId from here
export { generateEventId } from "./gtm";

/* ── Helper ────────────────────────────────────────────────── */

/**
 * Build GA4 item array from content_ids, or return provided items.
 * Items are required by GA4 ecommerce reports.
 */
function ensureItems(
  content_ids: string[],
  content_name?: string,
  price?: number,
  quantity?: number,
  existingItems?: DataLayerItem[],
): DataLayerItem[] {
  if (existingItems && existingItems.length > 0) return existingItems;
  return content_ids.map((id, i) => ({
    item_id: id,
    item_name: i === 0 ? (content_name ?? id) : id,
    price: i === 0 ? price : undefined,
    quantity: i === 0 ? (quantity ?? 1) : 1,
  }));
}

/* ── Hook ──────────────────────────────────────────────────── */

export function useAnalytics() {
  const { config } = useAnalyticsConfig();
  const cur = config?.meta?.currency ?? "BDT";
  const gtmEnabled = config?.analytics?.google_tag_manager?.enabled ?? false;

  /* ViewContent — fires on product detail page */
  const trackViewContent = useCallback(
    (data: Omit<ViewContentPayload, "currency">) => {
      if (!config || !gtmEnabled) return;
      const items = ensureItems(
        data.content_ids,
        data.content_name,
        data.value,
        1,
        data.items,
      );
      pushEcommerceEvent("view_item", {
        ecommerce: { currency: cur, value: data.value ?? 0, items },
      });
    },
    [config, gtmEnabled, cur],
  );

  /* AddToCart — fires when user adds item to cart */
  const trackAddToCart = useCallback(
    (data: Omit<AddToCartPayload, "currency">) => {
      if (!config || !gtmEnabled) return;
      const items = ensureItems(
        data.content_ids,
        data.content_name,
        data.value,
        data.quantity,
        data.items,
      );
      pushEcommerceEvent("add_to_cart", {
        ecommerce: { currency: cur, value: data.value, items },
      });
    },
    [config, gtmEnabled, cur],
  );

  /* InitiateCheckout — fires when user proceeds to checkout */
  const trackInitiateCheckout = useCallback(
    (data: Omit<InitiateCheckoutPayload, "currency">) => {
      if (!config || !gtmEnabled) return;
      const items =
        data.items ??
        (data.content_ids ?? []).map((id) => ({ item_id: id, item_name: id }));
      pushEcommerceEvent("begin_checkout", {
        ecommerce: { currency: cur, value: data.value, items },
      });
    },
    [config, gtmEnabled, cur],
  );

  /**
   * Purchase — fires after successful order placement.
   *
   * Returns the event_id used so the caller can pass it to the order API
   * for server-side FB CAPI deduplication.
   */
  const trackPurchase = useCallback(
    (data: Omit<PurchasePayload, "currency">) => {
      if (!config || !gtmEnabled) return;
      const eventId = data.event_id || generateEventId();
      const items =
        data.items ??
        (data.content_ids ?? []).map((id) => ({ item_id: id, item_name: id }));
      pushEcommerceEvent("purchase", {
        event_id: eventId,
        ecommerce: {
          currency: cur,
          value: data.value,
          transaction_id: data.order_id,
          items,
        },
      });
      return eventId;
    },
    [config, gtmEnabled, cur],
  );

  /* ViewCart — fires when cart drawer opens */
  const trackViewCart = useCallback(
    (data: Omit<ViewCartPayload, "currency">) => {
      if (!config || !gtmEnabled) return;
      const items = data.content_ids.map((id) => ({
        item_id: id,
        item_name: id,
      }));
      pushEcommerceEvent("view_cart", {
        ecommerce: { currency: cur, value: data.value, items },
      });
    },
    [config, gtmEnabled, cur],
  );

  /* RemoveFromCart — fires when user removes an item from cart */
  const trackRemoveFromCart = useCallback(
    (data: Omit<RemoveFromCartPayload, "currency">) => {
      if (!config || !gtmEnabled) return;
      const items = ensureItems(
        data.content_ids,
        data.content_name,
        data.value,
        data.quantity,
      );
      pushEcommerceEvent("remove_from_cart", {
        ecommerce: { currency: cur, value: data.value, items },
      });
    },
    [config, gtmEnabled, cur],
  );

  /* Search — fires when user submits a search query */
  const trackSearch = useCallback(
    (query: string) => {
      if (!config || !gtmEnabled) return;
      if (!config.tracking?.track_search) return;
      pushDataLayer({ event: "search", search_term: query });
    },
    [config, gtmEnabled],
  );

  /* PageView — fires on route change (auto-tracked by AnalyticsProvider) */
  const trackPageView = useCallback(
    (url?: string) => {
      if (!config || !gtmEnabled) return;
      pushDataLayer({
        event: "page_view",
        page_location:
          url ?? (typeof window !== "undefined" ? window.location.href : ""),
      });
    },
    [config, gtmEnabled],
  );

  /**
   * CompleteRegistration — fires after user registers.
   * Returns event_id for optional server-side CAPI call.
   */
  const trackCompleteRegistration = useCallback(
    (opts?: { event_id?: string }) => {
      if (!config || !gtmEnabled) return;
      const eventId = opts?.event_id || generateEventId();
      pushDataLayer({ event: "complete_registration", event_id: eventId });
      return eventId;
    },
    [config, gtmEnabled],
  );

  return {
    config,
    generateEventId,
    trackViewContent,
    trackAddToCart,
    trackViewCart,
    trackRemoveFromCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
    trackPageView,
    trackCompleteRegistration,
  };
}
