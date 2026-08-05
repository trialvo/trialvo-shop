// src/api/cart-discounts.api.ts
//
// Public endpoints for discount rules and cart-wide discount config used by
// the admin /new-sale billing panel to compute live order totals.

import { api } from "./client";
import type {
  CartDiscountConfig,
  AdminComboRule,
  ComboRuleTierItem,
} from "@/lib/discounts/calculateAdminCartTotals";
import type { BulkRule } from "./discount-rules.api";

// ── Rich display types (extend core types with product info) ──────────────────

/** Bulk rule enriched with product metadata for display */
export type PublicBulkRule = BulkRule & {
  product_name?: string;
  product_image?: string;
  color_name?: string;
  variant_name?: string;
  selling_price?: number;
  stock?: number;
  /** Per-unit SKU discount amount from product_skus.discount */
  sku_discount?: number;
  /** 0 = flat, 1 = percentage from product_skus.discount_type */
  sku_discount_type?: 0 | 1;
};

/** Combo tier item enriched with product metadata for display */
export type PublicComboTierItem = ComboRuleTierItem & {
  product_name?: string;
  product_image?: string;
  color_name?: string;
  variant_name?: string;
  sku?: string;
  stock?: number;
  /** Per-unit SKU discount amount from product_skus.discount */
  sku_discount?: number;
  /** 0 = flat, 1 = percentage from product_skus.discount_type */
  sku_discount_type?: 0 | 1;
};

export type PublicComboRuleTier = {
  discount_type: 0 | 1;
  discount_value: number;
  items: PublicComboTierItem[];
};

/** Combo rule enriched with product metadata per tier item */
export type PublicComboRule = Omit<AdminComboRule, "tiers"> & {
  name?: string;
  tiers: PublicComboRuleTier[];
};

// ── Raw shapes from the /user/ public endpoints ───────────────────────────────

interface RawBulkRule {
  id: number;
  name: string;
  product_sku_id: number;
  min_qty?: number;
  min_quantity?: number;
  discount_type: 0 | 1;
  discount_value: number | string;
  status?: boolean | number;
  free_delivery: boolean | number;
  sku?: string;
  product_name?: string;
  product_image?: string;
  color_name?: string;
  variant_name?: string;
  selling_price?: number | string;
  stock?: number;
  sku_discount?: number | string;
  sku_discount_type?: 0 | 1;
}

interface RawComboTierItem {
  product_sku_id: number;
  required_qty?: number;
  qty_needed?: number;
  selling_price?: number | string;
  product_name?: string;
  product_image?: string;
  color_name?: string;
  variant_name?: string;
  sku?: string;
  stock?: number;
  sku_discount?: number | string;
  sku_discount_type?: 0 | 1;
}


interface RawComboTier {
  discount_type: 0 | 1;
  discount_value: number | string;
  items: RawComboTierItem[];
}

interface RawComboRule {
  id: number;
  name?: string;
  status?: boolean | number;
  free_delivery: boolean | number;
  tiers?: RawComboTier[];
  discount_type?: 0 | 1;
  discount_value?: number | string;
  items?: RawComboTierItem[];
}

interface RawCartDiscountConfig {
  is_enabled?: boolean | number;
  enabled?: boolean | number;
  basis?: string;
  min_item_count?: number;
  min_total_selling_price?: number;
  discount_type?: string;
  discount_value?: number | string;
  apply_with_bulk_combo?: boolean | number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapBulkRule(raw: RawBulkRule): PublicBulkRule {
  return {
    id: raw.id,
    name: raw.name,
    product_sku_id: raw.product_sku_id,
    min_quantity: raw.min_qty ?? raw.min_quantity ?? 1,
    discount_type: raw.discount_type,
    discount_value: Number(raw.discount_value),
    // Backend pre-filters status=1 but doesn't return the field → default true
    status: raw.status !== undefined ? Boolean(raw.status) : true,
    free_delivery: Boolean(raw.free_delivery),
    sku: raw.sku,
    product_name: raw.product_name,
    product_image: raw.product_image,
    color_name: raw.color_name,
    variant_name: raw.variant_name,
    selling_price: raw.selling_price !== undefined ? Number(raw.selling_price) : undefined,
    stock: raw.stock,
    sku_discount: raw.sku_discount !== undefined ? Number(raw.sku_discount) : undefined,
    sku_discount_type: raw.sku_discount_type,
  };
}

function mapComboTierItem(i: RawComboTierItem): PublicComboTierItem {
  return {
    product_sku_id: i.product_sku_id,
    required_qty: i.required_qty ?? i.qty_needed ?? 1,
    selling_price: i.selling_price !== undefined ? Number(i.selling_price) : undefined,
    product_name: i.product_name,
    product_image: i.product_image,
    color_name: i.color_name,
    variant_name: i.variant_name,
    sku: i.sku,
    stock: i.stock,
    sku_discount: i.sku_discount !== undefined ? Number(i.sku_discount) : undefined,
    sku_discount_type: i.sku_discount_type,
  };
}

function mapComboRule(raw: RawComboRule): PublicComboRule {
  let tiers: PublicComboRuleTier[];

  if (Array.isArray(raw.tiers) && raw.tiers.length > 0) {
    tiers = raw.tiers.map((t) => ({
      discount_type: t.discount_type ?? 0,
      discount_value: Number(t.discount_value ?? 0),
      items: (t.items ?? []).map(mapComboTierItem),
    }));
  } else {
    tiers = [
      {
        discount_type: raw.discount_type ?? 0,
        discount_value: Number(raw.discount_value ?? 0),
        items: (raw.items ?? []).map(mapComboTierItem),
      },
    ];
  }

  return {
    id: raw.id,
    name: raw.name,
    status: raw.status !== undefined ? Boolean(raw.status) : true,
    free_delivery: Boolean(raw.free_delivery),
    tiers,
  };
}

function mapCartDiscountConfig(raw: RawCartDiscountConfig): CartDiscountConfig {
  return {
    is_enabled: Boolean(raw.is_enabled ?? raw.enabled ?? false),
    basis: raw.basis === "total_selling_price" ? "total_selling_price" : "item_count",
    min_item_count: Number(raw.min_item_count ?? 0),
    min_total_selling_price: Number(raw.min_total_selling_price ?? 0),
    discount_type: raw.discount_type === "percentage" ? "percentage" : "flat",
    discount_value: Number(raw.discount_value ?? 0),
    apply_with_bulk_combo: Boolean(raw.apply_with_bulk_combo ?? true),
  };
}

// ── Public fetchers ───────────────────────────────────────────────────────────

/** Fetches bulk rules (includes product name/image/color/variant) */
export async function fetchPublicBulkRules(): Promise<PublicBulkRule[]> {
  const res = await api.get<{ data?: RawBulkRule[]; success?: boolean } | RawBulkRule[]>(
    "/user/bulk-rules"
  );
  const raw = Array.isArray(res.data)
    ? (res.data as RawBulkRule[])
    : ((res.data as { data?: RawBulkRule[] }).data ?? []);
  return raw.map(mapBulkRule);
}

/** Fetches combo rules (includes product name/image/color/variant per item) */
export async function fetchPublicComboRules(): Promise<PublicComboRule[]> {
  const res = await api.get<{ data?: RawComboRule[]; success?: boolean } | RawComboRule[]>(
    "/user/combo-rules"
  );
  const raw = Array.isArray(res.data)
    ? (res.data as RawComboRule[])
    : ((res.data as { data?: RawComboRule[] }).data ?? []);
  return raw.map(mapComboRule);
}

/** Fetches cart-wide discount config */
export async function fetchPublicCartDiscountConfig(): Promise<CartDiscountConfig> {
  const res = await api.get<RawCartDiscountConfig>("/user/cart-discount-config");
  const raw: RawCartDiscountConfig =
    (res.data as unknown as { data?: RawCartDiscountConfig })?.data ?? res.data;
  return mapCartDiscountConfig(raw ?? {});
}

// ── SKU price sync (discount lookup) ─────────────────────────────────────────

export type SyncedSkuPrice = {
  id: number;          // product_sku_id
  price: number;       // final price (after per-unit discount)
  originalPrice: number; // selling_price (sticker price)
  discount: number;    // originalPrice - price  = per-unit discount amount
  stock: number;
  weight_kg?: number;
  free_delivery?: boolean;
};

/**
 * Fetches live per-unit discount for a list of SKU ids using /user/cart/sync.
 * The backend computes: discount = selling_price - final_price
 * This works on the live API without any backend changes.
 */
export async function fetchSkuPrices(skuIds: number[]): Promise<SyncedSkuPrice[]> {
  if (!skuIds.length) return [];
  const res = await api.post<{ success: boolean; data: SyncedSkuPrice[] }>(
    "/user/cart/sync",
    { sku_ids: skuIds }
  );
  return res.data?.data ?? [];
}


export type CouponValidatePayload = {
  coupon: string;
  order_items: { product_variation_id: number; quantity: number }[];
  customer_id?: number;
};

export type CouponValidateResponse = {
  success: boolean;
  /** The API wraps the result inside data.totals */
  data?: {
    coupon_title?: string;
    totals?: {
      total_coupon_discount?: number;
      total_selling_price?: number;
      total_sku_discount?: number;
      total_discount?: number;
      final_payable_amount?: number;
      [key: string]: unknown;
    };
    applied_items?: { product_variation_id: number; product_name: string; discount_applied: number }[];
  };
  /** Legacy / fallback top-level totals (some older endpoints) */
  totals?: {
    total_coupon_discount?: number;
    [key: string]: unknown;
  };
  error?: string;
  message?: string;
};

export async function adminValidateCoupon(
  payload: CouponValidatePayload
): Promise<CouponValidateResponse> {
  const res = await api.post<CouponValidateResponse>("/validateCoupon", payload);
  return res.data;
}
