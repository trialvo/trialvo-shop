import type { CartItem, GuestIdType } from "@/redux/slices/cartSlice";

const STORAGE_KEY = "ecom_cart_v1";

export type PersistedCart = {
  items: CartItem[];
  discount: number;
  appliedCoupon: { coupon: string | null; discount: number } | null;
  guestId: GuestIdType;
  buyNowId: number | null;
  isCartOpen: boolean;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadCartFromStorage(): PersistedCart | null {
  if (!isBrowser()) return null;

  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedCart>;
    if (!parsed || !Array.isArray(parsed.items)) return null;

    const applied =
      parsed.appliedCoupon && typeof parsed.appliedCoupon === "object"
        ? {
          coupon:
            typeof (parsed.appliedCoupon as { coupon?: unknown }).coupon === "string"
              ? (parsed.appliedCoupon as { coupon: string }).coupon
              : null,
          discount:
            typeof (parsed.appliedCoupon as { discount?: unknown }).discount === "number"
              ? (parsed.appliedCoupon as { discount: number }).discount
              : 0,
        }
        : null;

    let guestId: GuestIdType = null;

    if (parsed.guestId) {
      if (typeof parsed.guestId === "object" && parsed.guestId !== null) {
        const guestData = parsed.guestId as {
          id?: unknown;
          generatedAt?: unknown;
          timestamp?: unknown;
        };

        const id = typeof guestData.id === "string" ? guestData.id : null;

        if (id) {
          guestId = {
            id,
            generatedAt: typeof guestData.generatedAt === "string"
              ? guestData.generatedAt
              : new Date().toISOString(),
            timestamp: typeof guestData.timestamp === "number"
              ? guestData.timestamp
              : Date.now()
          };
        }
      }
    }

    return {
      items: parsed.items,
      discount: typeof parsed.discount === "number" ? parsed.discount : 0,
      appliedCoupon: applied,
      guestId: guestId,
      buyNowId: parsed?.buyNowId ?? null,
      isCartOpen: parsed?.isCartOpen ?? false
    };
  } catch {
    return null;
  }
}

export function saveCartToStorage(cart: PersistedCart): void {
  if (!isBrowser()) return;

  try {
    if (cart.items.length === 0 && cart.discount <= 0 && !cart.appliedCoupon?.coupon) {
      globalThis.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota errors
  }
}

export function clearCartStorage(): void {
  if (!isBrowser()) return;

  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
