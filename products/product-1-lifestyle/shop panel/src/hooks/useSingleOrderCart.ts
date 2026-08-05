"use client";

/**
 * hooks/useSingleOrderCart.ts — Mini-cart state for Single Order Page
 *
 * Manages cart items in React state + sessionStorage persistence.
 * Handles add/remove/update operations and computes totals including bulk discounts.
 */

import { useState, useCallback, useMemo } from "react";

import type {
  SOPMiniCartItem,
  SOPMiniCart,
  SOPBulkOffer,
  SOPVariation,
} from "@/types/single-order";

const SOP_CART_KEY = "sop_cart";

// ── Storage Helpers ──────────────────────────────────────────────────────────

function loadCartFromStorage(): SOPMiniCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SOP_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SOPMiniCart;
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function persistCart(cart: SOPMiniCart): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SOP_CART_KEY, JSON.stringify(cart));
}

function clearCartStorage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SOP_CART_KEY);
}

// ── Bulk Discount Calculator ─────────────────────────────────────────────────

type DeliveryBreakdown = {
  allFreeDelivery: boolean;
  hasMixedDelivery: boolean;
  paidWeightKg: number;
  bulkDiscount: number;
};

function computeDeliveryBreakdown(
  items: SOPMiniCartItem[],
  bulkOffers: SOPBulkOffer[],
): DeliveryBreakdown {
  if (items.length === 0) {
    return { allFreeDelivery: false, hasMixedDelivery: false, paidWeightKg: 0, bulkDiscount: 0 };
  }

  // Build qty map per SKU
  const qtyMap: Record<number, number> = {};
  for (const it of items) {
    qtyMap[it.skuId] = (qtyMap[it.skuId] ?? 0) + it.qty;
  }

  // Group bulk rules by SKU
  const bulkBySku: Record<number, SOPBulkOffer[]> = {};
  for (const r of bulkOffers) {
    if (!bulkBySku[r.product_sku_id]) bulkBySku[r.product_sku_id] = [];
    bulkBySku[r.product_sku_id].push(r);
  }
  for (const vid in bulkBySku) {
    bulkBySku[vid].sort((a, b) => b.min_qty - a.min_qty);
  }

  // Build price map
  const priceMap: Record<number, number> = {};
  for (const it of items) {
    if (!(it.skuId in priceMap)) priceMap[it.skuId] = it.unitPrice;
  }

  // Track SKUs with free delivery via bulk rule + compute bulk discount
  const freeViaRule = new Set<number>();
  let bd = 0;
  for (const vid in bulkBySku) {
    const qty = qtyMap[Number(vid)] ?? 0;
    const rule = bulkBySku[vid].find((r) => qty >= r.min_qty);
    if (!rule) continue;
    if (rule.free_delivery) freeViaRule.add(Number(vid));
    const base = priceMap[Number(vid)] ?? rule.sku_selling_price;
    const disc =
      rule.discount_type === 0
        ? rule.discount_value * qty
        : (base * rule.discount_value / 100) * qty;
    bd += disc;
  }
  bd = Math.round(bd * 100) / 100;

  const isEffFree = (it: SOPMiniCartItem) =>
    it.freeDelivery || freeViaRule.has(it.skuId);
  const allFree = items.every(isEffFree);
  const mixed = items.some(isEffFree) && items.some((i) => !isEffFree(i));
  const paidWt = items
    .filter((i) => !isEffFree(i))
    .reduce((s, i) => s + i.weightKg * i.qty, 0);

  return {
    allFreeDelivery: allFree,
    hasMixedDelivery: mixed,
    paidWeightKg: paidWt,
    bulkDiscount: bd,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSingleOrderCart(
  productId: number,
  productName: string,
  productImage: string,
  productFreeDelivery: boolean,
  bulkOffers: SOPBulkOffer[],
) {
  const [items, setItems] = useState<SOPMiniCartItem[]>(loadCartFromStorage);

  const syncStorage = useCallback(
    (nextItems: SOPMiniCartItem[]) => {
      const cart: SOPMiniCart = {
        productId,
        productName,
        productImage,
        productFreeDelivery,
        bulkOffers,
        items: nextItems,
      };
      persistCart(cart);
    },
    [productId, productName, productImage, productFreeDelivery, bulkOffers],
  );

  const addToCart = useCallback(
    (sku: SOPVariation, qty: number, unitPrice: number) => {
      setItems((prev) => {
        const existing = prev.findIndex((i) => i.skuId === sku.id);
        let next: SOPMiniCartItem[];

        if (existing >= 0) {
          next = [...prev];
          next[existing] = {
            ...next[existing],
            qty: next[existing].qty + qty,
          };
        } else {
          next = [
            ...prev,
            {
              skuId: sku.id,
              colorName: sku.color?.name ?? "—",
              variantName: sku.variant?.name ?? "—",
              qty,
              unitPrice,
              sellingPrice: sku.selling_price,
              weightKg: sku.weight_kg,
              sku: sku.sku,
              colorId: sku.color?.id ?? null,
              variantId: sku.variant?.id ?? null,
              freeDelivery: sku.free_delivery,
            },
          ];
        }

        syncStorage(next);
        return next;
      });
    },
    [syncStorage],
  );

  const removeFromCart = useCallback(
    (skuId: number) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.skuId !== skuId);
        if (next.length === 0) {
          clearCartStorage();
        } else {
          syncStorage(next);
        }
        return next;
      });
    },
    [syncStorage],
  );

  const updateCartQty = useCallback(
    (skuId: number, newQty: number) => {
      if (newQty < 1) return;
      setItems((prev) => {
        const next = prev.map((i) =>
          i.skuId === skuId ? { ...i, qty: newQty } : i,
        );
        syncStorage(next);
        return next;
      });
    },
    [syncStorage],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    clearCartStorage();
  }, []);

  // ── Derived Values ───────────────────────────────────────────────────────

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.sellingPrice * i.qty, 0),
    [items],
  );

  const itemDiscount = useMemo(
    () => items.reduce((s, i) => s + (i.sellingPrice - i.unitPrice) * i.qty, 0),
    [items],
  );

  const miniCartTotal = useMemo(
    () => items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
    [items],
  );

  const totalQty = useMemo(
    () => items.reduce((s, i) => s + i.qty, 0),
    [items],
  );

  const delivery = useMemo(
    () => computeDeliveryBreakdown(items, bulkOffers),
    [items, bulkOffers],
  );

  return {
    items,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    subtotal,
    itemDiscount,
    miniCartTotal,
    totalQty,
    ...delivery,
    /** Get the full MiniCart object for sessionStorage handoff to checkout */
    getCartPayload: (): SOPMiniCart => ({
      productId,
      productName,
      productImage,
      productFreeDelivery,
      bulkOffers,
      items,
    }),
  };
}

export { SOP_CART_KEY, clearCartStorage };
