import type { RootState } from "@/redux/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectBuyNowId = (s: RootState) => s.cart.buyNowId;
export const selectCartItems = (s: RootState) => s.cart.items;
const selectIsCartOpen = (s: RootState) => s.cart.isCartOpen;
export const selectCartDiscount = (s: RootState) => s.cart.discount;
export const selectCartDeliveryCharge = (s: RootState) => s.cart.deliveryCharge;
export const selectAppliedCoupon = (s: RootState) => s.cart.appliedCoupon;
export const selectGuestId = (s: RootState) => s.cart.guestId;
const selectWeightFreeKg = (s: RootState) => s.cart.weightFreeKg;
const selectWeightExtraPerKg = (s: RootState) => s.cart.weightExtraPerKg;
const selectBulkRules = (s: RootState) => s.discounts.bulkRules;
const selectComboRules = (s: RootState) => s.discounts.comboRules;
const selectCartDiscountConfig = (s: RootState) => s.discounts.cartDiscountConfig;

export const selectBuyNowItems = createSelector(
  [selectCartItems, selectBuyNowId],
  (items, buyNowId) => {
    if (buyNowId === null) return items;
    return items.filter((i) => i.productVariationId === buyNowId);
  },
);

export const selectCartCounts = createSelector([selectCartItems], (items) => {
  return {
    itemsCount: items.length,
    totalQty: items.reduce((sum, item) => sum + item.quantity, 0),
  };
});

export const selectCartTotals = createSelector(
  [selectCartItems, selectIsCartOpen, selectBuyNowId, selectAppliedCoupon, selectCartDeliveryCharge, selectWeightFreeKg, selectWeightExtraPerKg, selectBulkRules, selectComboRules, selectCartDiscountConfig],
  (cartItems, isCartOpen, buyNowId, appliedCoupon, delivery, weightFreeKg, weightExtraPerKg, bulkRules, comboRules, cartDiscountConfig) => {
    const items =
      isCartOpen || buyNowId === null
        ? cartItems
        : cartItems.filter((i) => i.productVariationId === buyNowId);

    const subtotal = items.reduce((sum, i) => {
      const unitPrice =
        typeof i.originalPrice === "number" && i.originalPrice > 0 ? i.originalPrice : i.price;
      return sum + unitPrice * i.quantity;
    }, 0);

    const skuDiscount = items.reduce((sum, i) => {
      const d = typeof i.discount === "number" && Number.isFinite(i.discount) ? i.discount : 0;
      return sum + d * i.quantity;
    }, 0);

    const couponDiscount = appliedCoupon?.discount ?? 0;

    // Weight surcharge: only paid-delivery items count
    // freeDelivery: true/false from syncCartItemsUser; undefined treated as paid
    const allFreeDelivery = items.length > 0 && items.every(i => i.freeDelivery === true);

    const paidWeightKgTotal = items
      .filter(i => !i.freeDelivery)  // exclude free delivery items
      .reduce((sum, i) => {
        const w = typeof i.weight_kg === "number" && Number.isFinite(i.weight_kg) ? i.weight_kg : 0;
        return sum + w * i.quantity;
      }, 0);

    // Keep total weight for display (all items) but surcharge only on paid items
    const weightKgTotal = paidWeightKgTotal;

    const excessKg = weightFreeKg > 0
      ? Math.max(0, weightKgTotal - weightFreeKg)
      : weightKgTotal;
    const weightSurcharge = !allFreeDelivery && weightExtraPerKg > 0 ? Math.round(excessKg * weightExtraPerKg) : 0;

    // ── Bulk Discount Calculation ────────────────────────────────────────────
    // Build a qty map: productVariationId → quantity
    const qtyMap: Record<number, number> = {};
    for (const item of items) {
      const vid = item.productVariationId;
      if (vid == null) continue;
      qtyMap[vid] = (qtyMap[vid] ?? 0) + item.quantity;
    }
    // Build a price map: productVariationId → effective price per unit (after SKU discount)
    const priceMap: Record<number, number> = {};
    for (const item of items) {
      const vid = item.productVariationId;
      if (vid == null || vid in priceMap) continue;
      const base = typeof item.originalPrice === "number" && item.originalPrice > 0 ? item.originalPrice : item.price;
      const skuD = typeof item.discount === "number" && Number.isFinite(item.discount) ? item.discount : 0;
      priceMap[vid] = base - skuD;
    }

    // Group bulk rules by SKU and sort each group DESC by min_qty —
    // then pick only the single best (first) qualifying rule per SKU.
    // This mirrors the backend: rules.find(r => r.min_qty <= qty) on a DESC list.
    const bulkRulesBySku: Record<number, typeof bulkRules> = {};
    for (const rule of bulkRules) {
      const vid = rule.product_sku_id;
      if (!bulkRulesBySku[vid]) bulkRulesBySku[vid] = [];
      bulkRulesBySku[vid].push(rule);
    }
    // Sort each group DESC by min_qty (highest threshold first)
    for (const vid in bulkRulesBySku) {
      bulkRulesBySku[vid].sort((a, b) => b.min_qty - a.min_qty);
    }

    // Track which SKUs get effective free delivery via a bulk rule
    const freeDeliveryViaRuleSkus = new Set<number>();

    let bulkDiscount = 0;
    for (const vid in bulkRulesBySku) {
      const qty = qtyMap[Number(vid)] ?? 0;
      // Pick only the first (best) rule the customer qualifies for
      const applicable = bulkRulesBySku[vid].find(r => qty >= r.min_qty);
      if (!applicable) continue;
      if (applicable.free_delivery) freeDeliveryViaRuleSkus.add(Number(vid));
      const base = priceMap[Number(vid)] ?? applicable.selling_price;
      const disc = Number(applicable.discount_type) === 0
        ? applicable.discount_value * qty
        : (base * applicable.discount_value / 100) * qty;
      bulkDiscount += disc;
    }
    bulkDiscount = Math.round(bulkDiscount * 100) / 100;

    // ── Combo Discount Calculation ───────────────────────────────────────────
    // Also collect SKUs that get free delivery via a satisfied combo rule
    let comboDiscount = 0;
    for (const rule of comboRules) {
      for (const tier of rule.tiers) {
        // Check if ALL items in the tier are satisfied
        const tierSatisfied = tier.items.every((ti) => {
          const vid = ti.product_sku_id;
          return (qtyMap[vid] ?? 0) >= ti.required_qty;
        });
        if (tierSatisfied) {
          // If the rule has free_delivery, mark all tier items as effectively free
          if (rule.free_delivery) {
            for (const ti of tier.items) freeDeliveryViaRuleSkus.add(ti.product_sku_id);
          }
          // Compute discount base = total prices of all tier items
          let tierBase = 0;
          for (const ti of tier.items) {
            const base = priceMap[ti.product_sku_id] ?? ti.selling_price;
            tierBase += base * ti.required_qty;
          }
          const disc = Number(tier.discount_type) === 0
            ? tier.discount_value
            : (tierBase * tier.discount_value) / 100;
          comboDiscount += disc;
          break; // Only apply highest satisfied tier per rule (rules are ordered by serial)
        }
      }
    }
    comboDiscount = Math.round(comboDiscount * 100) / 100;

    // ── Effective free delivery per item (per-SKU flag OR rule-based) ─────────
    // An item ships free if its SKU has freeDelivery=true OR it qualifies via a rule
    const isEffectivelyFree = (item: typeof items[number]) =>
      item.freeDelivery === true ||
      (item.productVariationId != null && freeDeliveryViaRuleSkus.has(item.productVariationId));

    const allFreeDeliveryEffective = items.length > 0 && items.every(isEffectivelyFree);

    // Override the earlier allFreeDelivery + paidWeightKgTotal to use effective logic
    const paidWeightKgTotalEffective = items
      .filter(i => !isEffectivelyFree(i))
      .reduce((sum, i) => {
        const w = typeof i.weight_kg === "number" && Number.isFinite(i.weight_kg) ? i.weight_kg : 0;
        return sum + w * i.quantity;
      }, 0);

    const excessKgEffective = weightFreeKg > 0
      ? Math.max(0, paidWeightKgTotalEffective - weightFreeKg)
      : paidWeightKgTotalEffective;
    const weightSurchargeEffective = !allFreeDeliveryEffective && weightExtraPerKg > 0
      ? Math.round(excessKgEffective * weightExtraPerKg)
      : 0;

    // ── Cart-Wide Discount Calculation ──────────────────────────────────────
    // Uses cartDiscountConfig from Redux (fetched from /user/cart-discount-config)
    let cartWideDiscount = 0;

    if (cartDiscountConfig.is_enabled) {
      // Skip cart-wide if apply_with_bulk_combo=false and there are bulk/combo discounts
      const hasBulkOrCombo = bulkDiscount > 0 || comboDiscount > 0;
      const shouldApply = !hasBulkOrCombo || cartDiscountConfig.apply_with_bulk_combo;

      if (shouldApply) {
        // Calculate net subtotal (after SKU discounts, before bulk/combo)
        const netSubtotal = items.reduce((sum, i) => {
          const base = typeof i.originalPrice === "number" && i.originalPrice > 0 ? i.originalPrice : i.price;
          const skuD = typeof i.discount === "number" && Number.isFinite(i.discount) ? i.discount : 0;
          return sum + (base - skuD) * i.quantity;
        }, 0);

        // Check eligibility
        let eligible = true;
        if (cartDiscountConfig.basis === "item_count") {
          const totalQty = items.reduce((s, i) => s + i.quantity, 0);
          eligible = totalQty >= cartDiscountConfig.min_item_count;
        } else if (cartDiscountConfig.basis === "total_selling_price") {
          eligible = netSubtotal >= cartDiscountConfig.min_total_selling_price;
        }

        if (eligible) {
          if (cartDiscountConfig.discount_type === "percentage") {
            cartWideDiscount = Math.round((netSubtotal * cartDiscountConfig.discount_value) / 100);
          } else {
            cartWideDiscount = cartDiscountConfig.discount_value;
          }
        }
      }
    }

    const totalDiscount = Math.max(0, skuDiscount + couponDiscount + bulkDiscount + comboDiscount + cartWideDiscount);

    // Waive delivery when ALL items are effectively free (per-SKU or rule-based)
    const effectiveDelivery = allFreeDeliveryEffective ? 0 : delivery;

    const total = Math.max(0, subtotal + effectiveDelivery + weightSurchargeEffective - skuDiscount - couponDiscount - bulkDiscount - comboDiscount - cartWideDiscount);

    // Mixed delivery: some items effectively free, some not
    const hasMixedDelivery = items.length > 0 && items.some(isEffectivelyFree) && items.some(i => !isEffectivelyFree(i));

    return {
      subtotal,
      delivery: effectiveDelivery,
      skuDiscount,
      couponDiscount,
      discount: skuDiscount,
      totalDiscount,
      weightKgTotal: paidWeightKgTotalEffective,
      weightSurcharge: weightSurchargeEffective,
      bulkDiscount,
      comboDiscount,
      cartWideDiscount,
      total,
      hasMixedDelivery,
    };
  },
);
