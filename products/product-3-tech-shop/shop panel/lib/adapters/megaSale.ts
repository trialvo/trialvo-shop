import type { Product } from "@/data/products";
import type { MegaSaleProductDto } from "@/lib/api/megasale/service";
import type { ProductListItem } from "@/lib/api/product/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { sanitizeProductSlug } from "@/lib/security/slug";

export type HotDealItem = {
  productId: number;
  skuId: number;
  title: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent: number;
  stock: number;
  inStock: boolean;
  endAt: string | null;
  colorName: string | null;
  variantName: string | null;
  serial: number;
};

export type HotDealsViewModel = {
  isActive: boolean;
  campaignEndAt: string | null;
  featured: HotDealItem | null;
  sideDeals: HotDealItem[];
  totalDeals: number;
};

/**
 * One product can appear multiple times (SKU rows). Keep the best-priced
 * in-stock SKU per product, then sort by campaign serial.
 */
export function dedupeMegaSaleProducts(
  rows: MegaSaleProductDto[],
): MegaSaleProductDto[] {
  const byProduct = new Map<number, MegaSaleProductDto>();

  for (const row of rows) {
    if (!row || typeof row.id !== "number" || row.id <= 0) continue;
    if (typeof row.product_sku_id !== "number" || row.product_sku_id <= 0) {
      continue;
    }

    const existing = byProduct.get(row.id);
    if (!existing) {
      byProduct.set(row.id, row);
      continue;
    }

    const existingPrice = Number(existing.final_price) || 0;
    const nextPrice = Number(row.final_price) || 0;
    const existingStock = Number(existing.stock) || 0;
    const nextStock = Number(row.stock) || 0;

    // Prefer in-stock, then lower final price, then higher serial priority (lower serial)
    const preferNext =
      (nextStock > 0 && existingStock <= 0) ||
      (nextStock > 0 === existingStock > 0 && nextPrice < existingPrice) ||
      (nextStock > 0 === existingStock > 0 &&
        nextPrice === existingPrice &&
        (Number(row.serial) || 0) < (Number(existing.serial) || 0));

    if (preferNext) byProduct.set(row.id, row);
  }

  return [...byProduct.values()].sort(
    (a, b) => (Number(a.serial) || 0) - (Number(b.serial) || 0),
  );
}

export function toHotDealItem(row: MegaSaleProductDto): HotDealItem | null {
  const slug = sanitizeProductSlug(row.slug);
  if (!slug) return null;

  const selling = Number(row.selling_price) || 0;
  const final =
    typeof row.final_price === "number" && row.final_price >= 0
      ? row.final_price
      : selling;
  const stock = Math.max(0, Number(row.stock) || 0);
  const discountPercent =
    typeof row.discount_percent === "number" && row.discount_percent > 0
      ? Math.round(row.discount_percent)
      : selling > final && selling > 0
        ? Math.round(((selling - final) / selling) * 100)
        : 0;

  return {
    productId: row.id,
    skuId: row.product_sku_id,
    title: (row.name || "").trim() || "Product",
    slug,
    image: resolveMediaUrl(row.thumbnail),
    price: final,
    originalPrice: discountPercent > 0 && selling > final ? selling : undefined,
    discountPercent,
    stock,
    inStock: stock > 0,
    endAt: row.product_end_at,
    colorName: row.color_name,
    variantName: row.variant_name,
    serial: Number(row.serial) || 0,
  };
}

export function toHotDealsViewModel(
  products: MegaSaleProductDto[],
  options: {
    isActive: boolean;
    campaignEndAt: string | null;
    featuredLimit?: number;
    sideLimit?: number;
  },
): HotDealsViewModel {
  const featuredLimit = options.featuredLimit ?? 1;
  const sideLimit = options.sideLimit ?? 2;

  if (!options.isActive) {
    return {
      isActive: false,
      campaignEndAt: null,
      featured: null,
      sideDeals: [],
      totalDeals: 0,
    };
  }

  const deals = dedupeMegaSaleProducts(products)
    .map(toHotDealItem)
    .filter((item): item is HotDealItem => item !== null);

  const featured = deals.slice(0, featuredLimit)[0] ?? null;
  const sideDeals = deals.slice(featuredLimit, featuredLimit + sideLimit);

  return {
    isActive: true,
    campaignEndAt: options.campaignEndAt,
    featured,
    sideDeals,
    totalDeals: deals.length,
  };
}

/**
 * Fallback when mega-sale is inactive: map best_deal product list → HotDealItem.
 * Keeps the unique Hot Deals layout visible on the homepage.
 */
export function listProductsToHotDealItems(
  products: ProductListItem[],
): HotDealItem[] {
  const items: HotDealItem[] = [];

  for (const p of products) {
    const slug = sanitizeProductSlug(p.slug);
    const sku = p.variations?.[0];
    if (!slug || !sku?.id) continue;

    const selling = Number(sku.selling_price) || 0;
    const final =
      typeof sku.final_price === "number" && sku.final_price >= 0
        ? sku.final_price
        : typeof p.price_range?.min === "number" && p.price_range.min > 0
          ? p.price_range.min
          : selling;
    const stock = Math.max(0, Number(sku.stock) || 0);
    const discountPercent =
      selling > final && selling > 0
        ? Math.round(((selling - final) / selling) * 100)
        : 0;

    items.push({
      productId: p.id,
      skuId: sku.id,
      title: (p.name || "").trim() || "Product",
      slug,
      image: resolveMediaUrl(p.thumbnail || p.images?.[0]?.path),
      price: final,
      originalPrice: discountPercent > 0 && selling > final ? selling : undefined,
      discountPercent,
      stock,
      inStock: stock > 0,
      endAt: null,
      colorName: null,
      variantName: null,
      serial: items.length,
    });
  }

  return items;
}

export function hotDealsFromListProducts(
  products: ProductListItem[],
  options?: { campaignEndAt?: string | null; sideLimit?: number },
): HotDealsViewModel {
  const deals = listProductsToHotDealItems(products);
  const sideLimit = options?.sideLimit ?? 3;
  const featured = deals[0] ?? null;
  const sideDeals = deals.slice(1, 1 + sideLimit);

  return {
    isActive: deals.length > 0,
    campaignEndAt: options?.campaignEndAt ?? null,
    featured,
    sideDeals,
    totalDeals: deals.length,
  };
}

/** Default countdown target when API has no campaign_end_at (end of next day). */
export function defaultHotDealEndAt(): string {
  const end = new Date();
  end.setDate(end.getDate() + 1);
  end.setHours(23, 59, 59, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`;
}

/** Map a hot-deal row into the cart Product shape with required SKU id. */
export function hotDealToCartProduct(deal: HotDealItem): Product {
  return {
    id: String(deal.productId),
    title: deal.title,
    slug: deal.slug,
    brand: "",
    category: "",
    price: deal.price,
    originalPrice: deal.originalPrice,
    discount: deal.discountPercent || undefined,
    rating: 0,
    reviewCount: 0,
    image: deal.image,
    badge: "sale",
    inStock: deal.inStock,
    description: "",
    colors: deal.colorName ? [deal.colorName] : undefined,
    defaultSkuId: deal.skuId,
  };
}
