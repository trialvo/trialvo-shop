"use client";

import { useCallback } from "react";
import type { Product } from "@/data/products";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addToCart as addToCartAction,
  clearCart as clearCartAction,
  removeFromCart as removeFromCartAction,
  replaceCartItem as replaceCartItemAction,
  setCartOpen,
  updateCartItem as updateCartItemAction,
  updateQuantity as updateQuantityAction,
} from "@/store/cart/cartSlice";
import {
  selectCartItems,
  selectCartTotalItems,
  selectCartTotalPrice,
  selectIsCartHydrated,
  selectIsCartOpen,
} from "@/store/cart/selectors";
import {
  getCartLineQuantity,
  isProductInCart,
  resolveSkuId,
} from "@/store/cart/cartLine";
import type { CartItem, ReplaceCartItemPayload } from "@/store/cart/types";

export type { CartItem } from "@/store/cart/types";

/**
 * Typed cart facade over the Redux Toolkit cart slice.
 * Drop-in replacement for the old CartContext API.
 */
export function useCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectCartTotalItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const isCartOpen = useAppSelector(selectIsCartOpen);
  const isCartHydrated = useAppSelector(selectIsCartHydrated);

  /**
   * @returns `true` when a new line was added; `false` if already in cart.
   */
  const addToCart = useCallback(
    (
      product: Product,
      quantity?: number,
      color?: string,
      productVariationId?: number,
      openDrawer = true,
    ): boolean => {
      const skuId = resolveSkuId(product, productVariationId);
      if (isProductInCart(items, product, skuId)) {
        if (openDrawer) {
          dispatch(setCartOpen(true));
        }
        return false;
      }

      dispatch(
        addToCartAction({
          product,
          quantity,
          color,
          productVariationId,
          openDrawer,
        }),
      );
      return true;
    },
    [dispatch, items],
  );

  const removeFromCart = useCallback(
    (productId: string, productVariationId?: number) => {
      dispatch(removeFromCartAction({ productId, productVariationId }));
    },
    [dispatch],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, productVariationId?: number) => {
      dispatch(
        updateQuantityAction({ productId, quantity, productVariationId }),
      );
    },
    [dispatch],
  );

  const updateCartItem = useCallback(
    (
      productId: string,
      quantity: number,
      productVariationId?: number,
      color?: string,
    ) => {
      dispatch(
        updateCartItemAction({
          productId,
          quantity,
          productVariationId,
          color,
        }),
      );
    },
    [dispatch],
  );

  const replaceCartItem = useCallback(
    (payload: ReplaceCartItemPayload) => {
      dispatch(replaceCartItemAction(payload));
    },
    [dispatch],
  );

  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  const setIsCartOpen = useCallback(
    (open: boolean) => {
      dispatch(setCartOpen(open));
    },
    [dispatch],
  );

  const isInCart = useCallback(
    (product: Product, productVariationId?: number) =>
      // Until localStorage hydrate finishes, always report false so SSR matches
      isCartHydrated && isProductInCart(items, product, productVariationId),
    [items, isCartHydrated],
  );

  const getQuantityInCart = useCallback(
    (product: Product, productVariationId?: number) =>
      isCartHydrated
        ? getCartLineQuantity(items, product, productVariationId)
        : 0,
    [items, isCartHydrated],
  );

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    replaceCartItem,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    isCartHydrated,
    isInCart,
    getQuantityInCart,
    resolveSkuId,
  };
}
