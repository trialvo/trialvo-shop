"use client"

import { useGuestId } from "@/hooks/useGuestId";
import { useGuestOrder } from "@/hooks/useGuestOrder";
import type { CreateGuestOrderPayload } from "@/lib/api/guest-order/service";
import type { CartItem } from "@/redux/slices/cartSlice";
import { useEffect, useRef } from "react";

export function useBuyNowGuestOrderEffect(
  buyNowItems: CartItem[],
  debounceTime: number = 500
) {
  const { id: guestId, loading: guestIdLoading, refresh: refreshGuestId } = useGuestId({ auto: false });
  const { createGuestOrder } = useGuestOrder();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const currentQuantityRef = useRef<number>(0);

  useEffect(() => {
    if (buyNowItems.length === 0) return;
    
    const currentTotalQuantity = buyNowItems.reduce((sum, item) => sum + item.quantity, 0);
    
    if (currentTotalQuantity !== currentQuantityRef.current) {
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(async () => {
        const resolvedGuestId = await refreshGuestId();
        if (!resolvedGuestId) {
          return;
        }

        try {
          const guestOrderPayload: CreateGuestOrderPayload = {
            id: resolvedGuestId,
            items: buyNowItems.map(item => ({
              product_sku_id: Number(item.productVariationId),
              quantity: item.quantity,
            })),
          };

          await createGuestOrder(guestOrderPayload);
        } catch (error) {
          console.error("Failed to create guest order:", error);
        }
      }, debounceTime);
      
      currentQuantityRef.current = currentTotalQuantity;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buyNowItems, guestId, refreshGuestId, createGuestOrder, debounceTime]);
}
