/**
 * Persist last placed order id for guest success / payment return recovery.
 */

import { sanitizeAuthText } from "@/lib/security/auth";

const KEY = "tech_shop_last_checkout_order";

export type LastCheckoutOrder = {
  orderId: string;
  mode: "auth" | "guest";
  paymentType: "cod" | "gateway";
  placedAt: number;
};

function canUse(): boolean {
  return typeof window !== "undefined";
}

export function writeLastCheckoutOrder(
  payload: Omit<LastCheckoutOrder, "placedAt">,
): void {
  if (!canUse()) return;
  try {
    const orderId = sanitizeAuthText(payload.orderId, 40);
    if (!orderId) return;
    const data: LastCheckoutOrder = {
      orderId,
      mode: payload.mode,
      paymentType: payload.paymentType,
      placedAt: Date.now(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readLastCheckoutOrder(): LastCheckoutOrder | null {
  if (!canUse()) return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastCheckoutOrder;
    if (!parsed?.orderId) return null;
    // Expire after 24h
    if (Date.now() - (parsed.placedAt || 0) > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return {
      ...parsed,
      orderId: sanitizeAuthText(parsed.orderId, 40),
    };
  } catch {
    return null;
  }
}

export function clearLastCheckoutOrder(): void {
  if (!canUse()) return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Recent place — suppress empty-cart UI while navigating to payment/success. */
export function isRecentLastCheckoutOrder(
  maxAgeMs = 5 * 60 * 1000,
): LastCheckoutOrder | null {
  const last = readLastCheckoutOrder();
  if (!last) return null;
  if (Date.now() - (last.placedAt || 0) > maxAgeMs) return null;
  return last;
}
