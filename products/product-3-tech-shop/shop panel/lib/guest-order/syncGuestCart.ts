import type { CartItem } from "@/store/cart/types";
import { guestOrderService } from "@/lib/api/guest-order/service";
import { buildCartOrderItems } from "@/lib/checkout/buildCartOrderItems";
import { ensureGuestId } from "@/lib/guest-order/guestId";

/**
 * Ensure a pending guest_orders row exists and matches the local cart.
 * Called when guest opens checkout (same pattern as graduate fashion shop).
 */
export async function syncGuestCartOrder(items: CartItem[]): Promise<string> {
  const guestId = ensureGuestId();
  const { guestItems } = buildCartOrderItems(items);

  const createRes = await guestOrderService.createGuestOrder({
    id: guestId,
    items: guestItems,
  });

  if (createRes?.error && createRes.success === false) {
    throw new Error(createRes.error || "Failed to create guest order");
  }

  // Keep server line items identical to local cart
  const replaceRes = await guestOrderService.replaceItems(guestId, {
    items: guestItems,
  });

  if (replaceRes?.error && replaceRes.success === false) {
    throw new Error(replaceRes.error || "Failed to sync guest cart");
  }

  return guestId;
}
