import type { ProductListParams } from "@/lib/api/product/service";
import type { ShopSortValue } from "@/components/shop/ShopToolbar";

export const SHOP_DEFAULT_MAX_PRICE = 200000;

export type ShopFilterState = Readonly<{
  category: string;
  brandIds: number[];
  minPrice: number;
  maxPrice: number;
  sort: ShopSortValue;
  freeDelivery: boolean;
  inStock: boolean;
  badge: string | null;
  search: string | null;
}>;

/** Parse comma-separated positive ints from a query value. */
export function parseIdList(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((p) => Number.parseInt(p.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];
}

export function formatIdList(ids: readonly number[]): string {
  return ids.filter((n) => n > 0).join(",");
}

export function parseShopSort(raw: string | null | undefined): ShopSortValue {
  switch (raw) {
    case "price-low":
    case "price-high":
    case "rating":
    case "discount":
    case "bestseller":
    case "newest":
      return raw;
    default:
      return "default";
  }
}

/**
 * Map UI sort → API sort_by / sort_order.
 * Rating/discount stay client-side (API has no matching columns).
 */
export function shopSortToApi(
  sort: ShopSortValue,
): Pick<ProductListParams, "sort_by" | "sort_order"> {
  switch (sort) {
    case "price-low":
      return { sort_by: "price", sort_order: "ASC" };
    case "price-high":
      return { sort_by: "price", sort_order: "DESC" };
    case "bestseller":
      return { sort_by: "sell_count", sort_order: "DESC" };
    case "newest":
      return { sort_by: "created_at", sort_order: "DESC" };
    case "default":
    default:
      return { sort_by: "created_at", sort_order: "DESC" };
  }
}

export function isClientOnlySort(sort: ShopSortValue): boolean {
  return sort === "rating" || sort === "discount";
}

/**
 * Read shop filters from URLSearchParams (client or server).
 */
export function readShopFiltersFromSearchParams(
  sp: URLSearchParams | Readonly<Record<string, string | undefined>>,
): ShopFilterState {
  const get = (key: string): string | null => {
    if (sp instanceof URLSearchParams) {
      return sp.get(key);
    }
    const v = sp[key];
    return typeof v === "string" && v.length > 0 ? v : null;
  };

  const minRaw = Number(get("min_price") ?? "");
  const maxRaw = Number(get("max_price") ?? "");

  return {
    category: (get("category") ?? "").trim(),
    brandIds: parseIdList(get("brand_id") ?? get("brands")),
    minPrice:
      Number.isFinite(minRaw) && minRaw >= 0 ? Math.floor(minRaw) : 0,
    maxPrice:
      Number.isFinite(maxRaw) && maxRaw > 0
        ? Math.floor(maxRaw)
        : SHOP_DEFAULT_MAX_PRICE,
    sort: parseShopSort(get("sort")),
    freeDelivery: get("free_delivery") === "1" || get("free_delivery") === "true",
    inStock: get("in_stock") === "1" || get("in_stock") === "true",
    badge: get("badge"),
    search: get("q") ?? get("search"),
  };
}

/**
 * Build a new query string from current params + filter patch.
 * Pass `null` to remove a key.
 */
export function buildShopSearchParams(
  current: URLSearchParams,
  patch: Readonly<Record<string, string | null | undefined>>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}
