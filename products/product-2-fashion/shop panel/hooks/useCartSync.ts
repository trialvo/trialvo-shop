"use client";

import * as React from "react";
import { productService } from "@/lib/api/product/service";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { syncCartItems } from "@/redux/slices/cartSlice";

export const useCartSync = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const cartItemsRef = React.useRef(cartItems);
  React.useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const syncCart = React.useCallback(async () => {
    const itemsToSync = cartItemsRef.current;
    if (!itemsToSync || itemsToSync.length === 0) return;

    // Extract all sku_ids from cart
    const skuIds = itemsToSync
      .map(item => item.productVariationId)
      .filter((id): id is number => typeof id === "number" && id > 0);

    if (skuIds.length === 0) return;

    setIsSyncing(true);
    try {
      const response = await productService.syncCartItems(skuIds);
      if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
        // Dispatch to update the cart in Redux with the latest prices and discounts
        dispatch(syncCartItems(response.data));
      }
    } catch (error) {
      console.error("Failed to sync cart items:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [dispatch]);

  return { syncCart, isSyncing };
};
