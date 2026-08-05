import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import {
  getCartLineQuantity,
  isProductInCart,
  resolveSkuId,
} from "@/store/cart/cartLine";
import type { Product } from "@/data/products";

export const selectCartState = (state: RootState) => state.cart;
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectIsCartOpen = (state: RootState) => state.cart.isCartOpen;
export const selectIsCartHydrated = (state: RootState) => state.cart.isHydrated;

export const selectCartTotalItems = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.quantity, 0),
);

export const selectCartTotalPrice = createSelector([selectCartItems], (items) =>
  items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
);

export function selectIsProductInCart(
  product: Product,
  productVariationId?: number,
) {
  return (state: RootState) =>
    isProductInCart(state.cart.items, product, productVariationId);
}

export function selectCartQuantityForProduct(
  product: Product,
  productVariationId?: number,
) {
  return (state: RootState) =>
    getCartLineQuantity(state.cart.items, product, productVariationId);
}

export { resolveSkuId };
