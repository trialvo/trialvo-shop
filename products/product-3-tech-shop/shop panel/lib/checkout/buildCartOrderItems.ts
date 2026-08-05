import type { CartItem } from "@/store/cart/types";
import type { CreateOrderItemPayload } from "@/lib/api/order/service";
import type { GuestOrderItemPayload } from "@/lib/api/guest-order/service";
import { isCodPaymentProvider } from "@/lib/checkout/paymentMethod";

export type BuiltOrderItems = {
  authItems: CreateOrderItemPayload[];
  guestItems: GuestOrderItemPayload[];
};

/**
 * Map cart lines to API order items.
 * Rejects lines without a valid product_sku_id — never invent IDs.
 */
export function buildCartOrderItems(items: CartItem[]): BuiltOrderItems {
  const authItems: CreateOrderItemPayload[] = [];
  const guestItems: GuestOrderItemPayload[] = [];

  for (const item of items) {
    const skuId =
      item.productVariationId ??
      item.product.defaultSkuId ??
      null;

    if (
      typeof skuId !== "number" ||
      !Number.isFinite(skuId) ||
      skuId <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error(
        `"${item.product.title}" is missing a valid product option. Remove it and add again from the product page.`,
      );
    }

    authItems.push({
      product_variation_id: skuId,
      quantity: item.quantity,
    });
    guestItems.push({
      product_sku_id: skuId,
      quantity: item.quantity,
    });
  }

  if (authItems.length === 0) {
    throw new Error("Your cart is empty");
  }

  return { authItems, guestItems };
}

export function buildFullAddress(input: {
  address: string;
  city?: string;
  division?: string;
}): string {
  return [input.address, input.city, input.division]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

export function toPaymentType(provider: string): "cod" | "gateway" {
  return isCodPaymentProvider(provider) ? "cod" : "gateway";
}
