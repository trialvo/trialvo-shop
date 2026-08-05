import type { Product } from "@/data/products";

/** One cart line — product + SKU + quantity. */
export type CartItem = {
  product: Product;
  quantity: number;
  color?: string;
  /** product_skus.id — required by order APIs */
  productVariationId?: number;
};

export type CartState = {
  items: CartItem[];
  isCartOpen: boolean;
  /** False until localStorage has been hydrated on the client. */
  isHydrated: boolean;
};

export type AddToCartPayload = {
  product: Product;
  quantity?: number;
  color?: string;
  productVariationId?: number;
  /** When false, do not open the cart drawer (e.g. quick place order). */
  openDrawer?: boolean;
};

export type CartLineKeyPayload = {
  productId: string;
  productVariationId?: number;
};

export type UpdateQuantityPayload = CartLineKeyPayload & {
  quantity: number;
};

/** Edit an existing line (quantity and optional color label). */
export type UpdateCartItemPayload = CartLineKeyPayload & {
  quantity: number;
  color?: string;
};

/**
 * Replace a cart line after a full edit (SKU / price / options may change).
 * `previous*` identifies the line being edited.
 */
export type ReplaceCartItemPayload = {
  previousProductId: string;
  previousVariationId?: number;
  product: Product;
  quantity: number;
  color?: string;
  productVariationId?: number;
};

export const CART_QTY_MIN = 1;
export const CART_QTY_MAX = 99;
