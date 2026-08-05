"use client";

import { toast } from "sonner";
import type { Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { resolveMediaUrl } from "@/lib/media/url";

type BudgetCartSource = Readonly<{
  product_id: number;
  product_name: string;
  product_slug: string;
  sku_id: number;
  thumbnail: string | null;
  color_name?: string | null;
  effective_price: number;
  original_price?: number;
}>;

/**
 * Build a minimal UI Product for cart from a budget-plan line.
 * Uses the SKU the planner already selected — no QuickAdd modal required.
 */
export function budgetItemToCartProduct(item: BudgetCartSource): Product {
  return {
    id: String(item.product_id),
    title: item.product_name,
    slug: item.product_slug,
    brand: "",
    category: "",
    price: item.effective_price,
    originalPrice: item.original_price,
    rating: 0,
    reviewCount: 0,
    image: resolveMediaUrl(item.thumbnail),
    inStock: true,
    description: "",
    defaultSkuId: item.sku_id,
  };
}

/**
 * Hook: add a budget-plan suggestion to the cart with suggested qty.
 */
export function useBudgetQuickAdd() {
  const { addToCart, isInCart } = useCart();

  const quickAdd = (
    item: BudgetCartSource,
    quantity: number,
  ): boolean => {
    const product = budgetItemToCartProduct(item);
    if (isInCart(product, item.sku_id)) {
      toast.message("Already in cart", {
        description: "Remove it from the cart before adding again.",
      });
      return false;
    }
    const qty = Math.min(99, Math.max(1, Math.floor(quantity) || 1));
    const added = addToCart(
      product,
      qty,
      item.color_name ?? undefined,
      item.sku_id,
    );
    if (added) {
      toast.success(
        qty > 1 ? `Added ${qty} to cart` : "Added to cart",
      );
    }
    return added;
  };

  return { quickAdd };
}
