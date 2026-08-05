/**
 * Typed localStorage utility.
 * - All storage keys are defined as a const enum to prevent string typos.
 * - All reads go through shape-validator functions before being accepted.
 * - All writes are wrapped in try/catch for quota/private-mode resilience.
 */

import type { CartItem } from "@/types/cart";

export const STORAGE_KEYS = {
  CART: "lifestyle_cart",
  CART_DISCOUNT: "lifestyle_cart_discount",
  CART_DELIVERY: "lifestyle_cart_delivery",
  CART_COUPON: "lifestyle_cart_coupon",
  CART_GUEST_ID: "lifestyle_cart_guestId",
  CART_BUY_NOW: "lifestyle_cart_buyNowId",
  WISHLIST: "lifestyle_wishlist",
  ORDERS: "lifestyle_orders",
  USER: "lifestyle_user",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function safeRead(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return null;
  }
}

export function storageSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

/** Remove a key from localStorage safely. */
export function storageClear(key: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// ── Shape validators ─────────────────────────────────────────────────────────

function isCartItem(v: unknown): v is CartItem {
  if (typeof v !== "object" || v === null) return false;
  const x = v as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.title === "string" &&
    typeof x.price === "number" &&
    typeof x.quantity === "number" &&
    typeof x.size === "string" &&
    typeof x.color === "string" &&
    typeof x.image === "string"
  );
}

// ── Typed loaders ─────────────────────────────────────────────────────────────

export function loadCart(): CartItem[] {
  const parsed = safeRead(STORAGE_KEYS.CART);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isCartItem);
}

export function loadCartDiscount(): number {
  const parsed = safeRead(STORAGE_KEYS.CART_DISCOUNT);
  return typeof parsed === "number" ? parsed : 0;
}

export function loadCartDeliveryCharge(): number {
  const parsed = safeRead(STORAGE_KEYS.CART_DELIVERY);
  return typeof parsed === "number" ? parsed : 0;
}

export function loadCartCoupon(): { coupon: string | null; discount: number } | null {
  const parsed = safeRead(STORAGE_KEYS.CART_COUPON);
  if (typeof parsed !== "object" || parsed === null) return null;
  return parsed as { coupon: string | null; discount: number };
}

export function loadGuestId(): { id: string | null; timestamp: number; generatedAt: string } | null {
  const parsed = safeRead(STORAGE_KEYS.CART_GUEST_ID);
  if (typeof parsed !== "object" || parsed === null) return null;
  return parsed as { id: string | null; timestamp: number; generatedAt: string };
}

export function loadBuyNowId(): number | null {
  const parsed = safeRead(STORAGE_KEYS.CART_BUY_NOW);
  return typeof parsed === "number" ? parsed : null;
}

export function clearCartStorage(): void {
  storageClear(STORAGE_KEYS.CART);
  storageClear(STORAGE_KEYS.CART_DISCOUNT);
  storageClear(STORAGE_KEYS.CART_DELIVERY);
  storageClear(STORAGE_KEYS.CART_COUPON);
  storageClear(STORAGE_KEYS.CART_GUEST_ID);
  storageClear(STORAGE_KEYS.CART_BUY_NOW);
}

export function saveCartState(state: {
  items: CartItem[];
  discount: number;
  deliveryCharge: number;
  appliedCoupon: { coupon: string | null; discount: number } | null;
  guestId: { id: string | null; timestamp: number; generatedAt: string } | null;
  buyNowId: number | null;
}): void {
  storageSave(STORAGE_KEYS.CART, state.items);
  storageSave(STORAGE_KEYS.CART_DISCOUNT, state.discount);
  storageSave(STORAGE_KEYS.CART_DELIVERY, state.deliveryCharge);
  storageSave(STORAGE_KEYS.CART_COUPON, state.appliedCoupon);
  storageSave(STORAGE_KEYS.CART_GUEST_ID, state.guestId);
  storageSave(STORAGE_KEYS.CART_BUY_NOW, state.buyNowId);
}
