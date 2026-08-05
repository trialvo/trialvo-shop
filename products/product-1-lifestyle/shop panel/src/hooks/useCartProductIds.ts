import { useMemo } from "react";
import { useAppSelector } from "@/store";
import { selectCartItems } from "@/store/slices/cartSlice";

/**
 * Returns a Set of product IDs that are currently in the cart.
 * Useful for checking if a product is already added without
 * knowing the exact size/color variant — shows "In Cart" state
 * on product cards where variant is not yet selected.
 */
export function useCartProductIds(): Set<number> {
  const items = useAppSelector(selectCartItems);

  return useMemo(() => {
    const ids = new Set<number>();
    for (const item of items) {
      const numId = Number(item.productId);
      if (Number.isFinite(numId)) ids.add(numId);
    }
    return ids;
  }, [items]);
}
