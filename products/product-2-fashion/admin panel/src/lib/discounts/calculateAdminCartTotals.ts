// src/lib/discounts/calculateAdminCartTotals.ts
//
// Pure function that mirrors the shop panel's selectCartTotals Redux selector.
// Used by BillingPanel to show live cost breakdown without Redux.

import type { BulkRule } from "@/api/discount-rules.api";
import type { DeliveryChargeEntity } from "@/api/delivery-charges.api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminCartItem = {
  key: string;
  productVariationId?: number;
  unitPrice: number;          // final price (after sku discount already applied)
  originalPrice?: number;     // selling_price before discount
  discount?: number;          // per-unit SKU discount amount
  qty: number;
  weight_kg?: number;
  freeDelivery?: boolean;
};

export type ComboRuleTierItem = {
  product_sku_id: number;
  required_qty: number;
  selling_price?: number;
};

export type ComboRuleTier = {
  discount_type: 0 | 1;
  discount_value: number;
  items: ComboRuleTierItem[];
};

export type AdminComboRule = {
  id: number;
  status: boolean;
  free_delivery: boolean;
  tiers: ComboRuleTier[];
};

export type CartDiscountConfig = {
  is_enabled: boolean;
  basis: "item_count" | "total_selling_price";
  min_item_count: number;
  min_total_selling_price: number;
  discount_type: "percentage" | "flat";
  discount_value: number;
  apply_with_bulk_combo: boolean;
};

export const DEFAULT_CART_DISCOUNT_CONFIG: CartDiscountConfig = {
  is_enabled: false,
  basis: "item_count",
  min_item_count: 0,
  min_total_selling_price: 0,
  discount_type: "flat",
  discount_value: 0,
  apply_with_bulk_combo: true,
};

// ── Result ────────────────────────────────────────────────────────────────────

export type AdminCartTotals = {
  subtotal: number;
  skuDiscount: number;
  bulkDiscount: number;
  comboDiscount: number;
  cartWideDiscount: number;
  couponDiscount: number;
  delivery: number;
  weightSurcharge: number;
  weightKgTotal: number;
  total: number;
  allFreeDelivery: boolean;
  hasMixedDelivery: boolean;
};

// ── Calculator ────────────────────────────────────────────────────────────────

export function calculateAdminCartTotals(opts: {
  cart: AdminCartItem[];
  deliveryCharge: DeliveryChargeEntity | null;
  bulkRules: BulkRule[];
  comboRules: AdminComboRule[];
  cartDiscountConfig: CartDiscountConfig;
  couponDiscount: number;
}): AdminCartTotals {
  const { cart, deliveryCharge, bulkRules, comboRules, cartDiscountConfig, couponDiscount } = opts;

  const weightFreeKg = Number(deliveryCharge?.default_weight_kg ?? 0);
  const weightExtraPerKg = Number(deliveryCharge?.extra_charge_per_kg ?? 0);
  const baseDelivery = Number(deliveryCharge?.customer_charge ?? 0);

  // ── Subtotal & SKU discount ────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, i) => {
    const base = i.originalPrice != null && i.originalPrice > 0 ? i.originalPrice : i.unitPrice;
    return sum + base * i.qty;
  }, 0);

  const skuDiscount = cart.reduce((sum, i) => {
    const d = typeof i.discount === "number" && Number.isFinite(i.discount) ? i.discount : 0;
    return sum + d * i.qty;
  }, 0);

  // ── Qty map ───────────────────────────────────────────────────────────────
  const qtyMap: Record<number, number> = {};
  for (const item of cart) {
    const vid = item.productVariationId;
    if (vid == null) continue;
    qtyMap[vid] = (qtyMap[vid] ?? 0) + item.qty;
  }

  // ── Price map (price per unit after SKU discount) ─────────────────────────
  const priceMap: Record<number, number> = {};
  for (const item of cart) {
    const vid = item.productVariationId;
    if (vid == null || vid in priceMap) continue;
    const base = item.originalPrice != null && item.originalPrice > 0 ? item.originalPrice : item.unitPrice;
    const skuD = typeof item.discount === "number" && Number.isFinite(item.discount) ? item.discount : 0;
    priceMap[vid] = base - skuD;
  }

  // ── Bulk discount ─────────────────────────────────────────────────────────
  const freeDeliveryViaRuleSkus = new Set<number>();
  const bulkRulesBySku: Record<number, typeof bulkRules> = {};
  for (const rule of bulkRules) {
    const vid = rule.product_sku_id;
    if (!bulkRulesBySku[vid]) bulkRulesBySku[vid] = [];
    bulkRulesBySku[vid].push(rule);
  }
  for (const vid in bulkRulesBySku) {
    bulkRulesBySku[Number(vid)].sort((a, b) => b.min_quantity - a.min_quantity);
  }

  let bulkDiscount = 0;
  for (const vid in bulkRulesBySku) {
    const vidNum = Number(vid);
    const qty = qtyMap[vidNum] ?? 0;
    const applicable = bulkRulesBySku[vidNum].find((r) => qty >= r.min_quantity);
    if (!applicable) continue;
    if (applicable.free_delivery) freeDeliveryViaRuleSkus.add(vidNum);
    const base = priceMap[vidNum] ?? 0;
    const disc =
      Number(applicable.discount_type) === 0
        ? applicable.discount_value * qty
        : (base * applicable.discount_value / 100) * qty;
    bulkDiscount += disc;
  }
  bulkDiscount = Math.round(bulkDiscount * 100) / 100;

  // ── Combo discount ────────────────────────────────────────────────────────
  let comboDiscount = 0;
  for (const rule of comboRules) {
    if (!rule.status) continue;
    for (const tier of rule.tiers) {
      const tierSatisfied = tier.items.every(
        (ti) => (qtyMap[ti.product_sku_id] ?? 0) >= ti.required_qty
      );
      if (tierSatisfied) {
        if (rule.free_delivery) {
          for (const ti of tier.items) freeDeliveryViaRuleSkus.add(ti.product_sku_id);
        }
        let tierBase = 0;
        for (const ti of tier.items) {
          const base = priceMap[ti.product_sku_id] ?? ti.selling_price ?? 0;
          tierBase += base * ti.required_qty;
        }
        const disc =
          Number(tier.discount_type) === 0
            ? tier.discount_value
            : (tierBase * tier.discount_value) / 100;
        comboDiscount += disc;
        break; // only best tier per rule
      }
    }
  }
  comboDiscount = Math.round(comboDiscount * 100) / 100;

  // ── Effective free delivery per item ──────────────────────────────────────
  const isEffectivelyFree = (item: AdminCartItem) =>
    item.freeDelivery === true ||
    (item.productVariationId != null &&
      freeDeliveryViaRuleSkus.has(item.productVariationId));

  const allFreeDelivery =
    cart.length > 0 && cart.every(isEffectivelyFree);

  const hasMixedDelivery =
    cart.length > 0 &&
    cart.some(isEffectivelyFree) &&
    cart.some((i) => !isEffectivelyFree(i));

  // ── Weight surcharge (paid items only) ───────────────────────────────────
  const paidWeightKg = cart
    .filter((i) => !isEffectivelyFree(i))
    .reduce((sum, i) => {
      const w = typeof i.weight_kg === "number" && Number.isFinite(i.weight_kg) ? i.weight_kg : 0;
      return sum + w * i.qty;
    }, 0);

  const excessKg = weightFreeKg > 0 ? Math.max(0, paidWeightKg - weightFreeKg) : paidWeightKg;
  const weightSurcharge =
    !allFreeDelivery && weightExtraPerKg > 0
      ? Math.round(excessKg * weightExtraPerKg)
      : 0;

  // ── Cart-wide discount ────────────────────────────────────────────────────
  let cartWideDiscount = 0;
  if (cartDiscountConfig.is_enabled) {
    const hasBulkOrCombo = bulkDiscount > 0 || comboDiscount > 0;
    const shouldApply =
      !hasBulkOrCombo || cartDiscountConfig.apply_with_bulk_combo;

    if (shouldApply) {
      const netSubtotal = cart.reduce((sum, i) => {
        const base = i.originalPrice != null && i.originalPrice > 0 ? i.originalPrice : i.unitPrice;
        const skuD = typeof i.discount === "number" && Number.isFinite(i.discount) ? i.discount : 0;
        return sum + (base - skuD) * i.qty;
      }, 0);

      let eligible = true;
      if (cartDiscountConfig.basis === "item_count") {
        const totalQty = cart.reduce((s, i) => s + i.qty, 0);
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

  // ── Delivery ──────────────────────────────────────────────────────────────
  const effectiveDelivery = allFreeDelivery ? 0 : baseDelivery;

  // ── Total ─────────────────────────────────────────────────────────────────
  const total = Math.max(
    0,
    subtotal +
      effectiveDelivery +
      weightSurcharge -
      skuDiscount -
      bulkDiscount -
      comboDiscount -
      cartWideDiscount -
      couponDiscount
  );

  return {
    subtotal,
    skuDiscount,
    bulkDiscount,
    comboDiscount,
    cartWideDiscount,
    couponDiscount,
    delivery: effectiveDelivery,
    weightSurcharge,
    weightKgTotal: paidWeightKg,
    total,
    allFreeDelivery,
    hasMixedDelivery,
  };
}
