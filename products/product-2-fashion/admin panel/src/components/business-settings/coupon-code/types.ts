// src/components/coupon-code/types.ts

import type {
  ApiCouponListItem,
  ApiCouponScope,
  ApiDiscountType,
} from "@/api/coupon.api";

export type DiscountType = "flat" | "percent";
export type CouponScope = "all" | "specified";

export type Option = { value: string; label: string };

export type CouponRow = {
  id: number;

  title: string;
  code: string;

  discountType: DiscountType;
  discountValue: number;

  minPurchase: number;
  maxDiscount: number; // only used when percent
  limitPerUser: number;

  productScope: CouponScope;
  productIds: number[];

  customerScope: CouponScope;
  customerIds: number[];

  startDate: string; // YYYY-MM-DD
  expireDate: string; // YYYY-MM-DD

  status: boolean;

  productCount: number;
  customerCount: number;
};

export type ProductLite = {
  id: number; // variation_id
  sku: string;
  name: string;
};

export type CustomerLite = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
};

export function safeNumber(input: string, fallback = 0): number {
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toDiscountType(v: ApiDiscountType): DiscountType {
  return v === 1 ? "percent" : "flat";
}

export function toApiDiscountType(v: DiscountType): ApiDiscountType {
  return v === "percent" ? 1 : 0;
}

export function toCouponScope(v: ApiCouponScope): CouponScope {
  return v === "specified" ? "specified" : "all";
}

export function toApiCouponScope(v: CouponScope): ApiCouponScope {
  return v === "specified" ? "specified" : "all";
}

export function toBoolStatus(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return false;
}

export function toYmdFromIso(iso: string): string {
  // Backend sends ISO Z strings. HTML date input expects YYYY-MM-DD.
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    // If already YYYY-MM-DD
    return iso.slice(0, 10);
  }
}

export function mapApiCouponListItemToRow(x: ApiCouponListItem): CouponRow {
  const discountType = toDiscountType(x.discount_type);

  return {
    id: x.id,
    title: x.title,
    code: x.code,

    discountType,
    discountValue: Number(x.discount ?? 0),

    minPurchase: Number(x.min_purchase_amount ?? 0),
    maxDiscount: discountType === "percent" ? Number(x.max_discount_amount ?? 0) : 0,
    limitPerUser: Number(x.limit_per_user ?? 1),

    productScope: toCouponScope(x.product_scope),
    productIds: [],

    customerScope: toCouponScope(x.customer_scope),
    customerIds: [],

    startDate: toYmdFromIso(x.start_date),
    expireDate: toYmdFromIso(x.expire_date),

    status: toBoolStatus(x.status),

    productCount: Number(x.product_count ?? 0),
    customerCount: Number(x.customer_count ?? 0),
  };
}
