/**
 * Adapts API ProductListItem/ProductDetail to the UI Product interface.
 * Keeps presentation components decoupled from API payload shape.
 */
import type {
  ProductListItem,
  ProductDetail,
  RelatedProduct,
  ProductVariationListItem,
} from "@/lib/api/product/service";
import type { Product } from "@/data/products";
import { resolveMediaUrl } from "@/lib/media/url";

export type ProductBadge = NonNullable<Product["badge"]>;

export type ToUIProductOptions = {
  /** Force a section-specific badge (e.g. "new" for New Arrivals). */
  forceBadge?: ProductBadge;
};

function calcDiscountPercent(
  sellingPrice: number,
  finalPrice: number,
): number | undefined {
  if (!(sellingPrice > 0) || !(finalPrice >= 0) || finalPrice >= sellingPrice) {
    return undefined;
  }
  return Math.round(((sellingPrice - finalPrice) / sellingPrice) * 100);
}

function pickVariationPricing(variations: ProductVariationListItem[] | undefined) {
  const first = variations?.[0];
  if (!first) {
    return { price: 0, originalPrice: undefined as number | undefined, discount: undefined as number | undefined };
  }

  const selling = Number(first.selling_price) || 0;
  const final =
    typeof first.final_price === "number" && first.final_price > 0
      ? first.final_price
      : selling;
  const discount =
    first.has_discount || final < selling
      ? calcDiscountPercent(selling, final)
      : undefined;

  return {
    price: final,
    originalPrice: discount ? selling : undefined,
    discount,
  };
}

function deriveBadge(
  p: Pick<ProductListItem, "featured" | "best_deal"> & {
    price_range?: { has_discount?: boolean };
  },
  discount: number | undefined,
  forceBadge?: ProductBadge,
): ProductBadge | undefined {
  if (forceBadge) return forceBadge;
  if (p.featured) return "hot";
  if (p.best_deal) return "bestseller";
  if (p.price_range?.has_discount || (discount !== undefined && discount >= 15)) {
    return "sale";
  }
  return undefined;
}

export function toUIProduct(
  p: ProductListItem,
  options: ToUIProductOptions = {},
): Product {
  const { forceBadge } = options;
  const pricing = pickVariationPricing(p.variations);
  const rangeMin = p.price_range?.min;
  const price =
    typeof rangeMin === "number" && rangeMin > 0 ? rangeMin : pricing.price;

  const originalFromRange =
    pricing.originalPrice && pricing.originalPrice > price
      ? pricing.originalPrice
      : undefined;

  const discount =
    pricing.discount ??
    (originalFromRange
      ? calcDiscountPercent(originalFromRange, price)
      : undefined);

  const mainImage = resolveMediaUrl(
    p.thumbnail || p.images?.[0]?.path,
  );

  return {
    id: String(p.id),
    title: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? "",
    category:
      p.child_category?.name ??
      p.sub_category?.name ??
      p.main_category?.name ??
      "",
    price,
    originalPrice: originalFromRange,
    discount,
    rating: p.avg_rating ?? 0,
    reviewCount: p.review_count ?? 0,
    image: mainImage,
    images: p.images?.length
      ? p.images.map((img) => resolveMediaUrl(img.path))
      : [mainImage],
    badge: deriveBadge(p, discount, forceBadge),
    freeDelivery: Boolean(p.free_delivery),
    inStock: (p.variations?.[0]?.stock ?? 0) > 0,
    description: "",
    codAvailable: true,
    defaultSkuId: p.variations?.[0]?.id,
  };
}

export function toUIProductFromDetail(p: ProductDetail): Product {
  const firstVariation = p.variations?.[0];
  const selling = Number(firstVariation?.selling_price) || 0;
  const final =
    typeof firstVariation?.final_price === "number" && firstVariation.final_price > 0
      ? firstVariation.final_price
      : p.summary?.min_price ?? selling;
  const discount = calcDiscountPercent(selling, final);
  const mainImage = resolveMediaUrl(p.images?.[0]?.path);

  const specs: Record<string, string> = {};
  if (p.brand?.name) specs["Brand"] = p.brand.name;
  if (p.main_category?.name) specs["Category"] = p.main_category.name;
  if (p.sub_category?.name) specs["Sub Category"] = p.sub_category.name;
  if (p.child_category?.name) specs["Type"] = p.child_category.name;
  if (p.attribute?.name) specs["Attribute"] = p.attribute.name;
  if (p.available_variants?.length) {
    const attrLabel =
      p.available_variants[0]?.attribute_name?.split(" - ")[0] || "Sizes";
    specs[attrLabel] = p.available_variants.map((v) => v.name).join(", ");
  }
  if (p.available_colors?.length) {
    specs["Colors"] = p.available_colors.map((c) => c.name).join(", ");
  }
  if (p.summary?.total_stock != null) {
    specs["Total Stock"] = String(p.summary.total_stock);
  }

  const plainShort = (p.short_description || "").replace(/<[^>]+>/g, "").trim();
  const highlights = plainShort
    ? plainShort
        .split(/[.\n•]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8)
        .slice(0, 6)
    : undefined;

  const inStock =
    (p.summary?.total_in_stock ?? 0) > 0 ||
    (p.variations ?? []).some((v) => v.in_stock || v.stock > 0);

  return {
    id: String(p.id),
    title: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? "",
    category:
      p.child_category?.name ??
      p.sub_category?.name ??
      p.main_category?.name ??
      "",
    price: final,
    originalPrice: discount ? selling : undefined,
    discount,
    rating: 0,
    reviewCount: 0,
    image: mainImage,
    images: p.images?.length
      ? Array.from(
          new Set(p.images.map((img) => resolveMediaUrl(img.path))),
        )
      : [mainImage],
    badge: p.featured
      ? "hot"
      : p.best_deal
        ? "bestseller"
        : discount && discount > 20
          ? "sale"
          : undefined,
    freeDelivery: Boolean(p.free_delivery),
    inStock,
    description: p.long_description || p.short_description || "",
    highlights,
    specifications: Object.keys(specs).length > 0 ? specs : undefined,
    colors: p.available_colors?.map((c) => c.name) ?? [],
    warranty: p.free_delivery ? "Free Delivery Available" : "Official Warranty",
    codAvailable: true,
    defaultSkuId: firstVariation?.id,
  };
}

export function toUIProductFromRelated(p: RelatedProduct): Product {
  const firstVar = p.variations?.[0];
  const price = p.min_price ?? firstVar?.final_price ?? firstVar?.selling_price ?? 0;
  const mainImage = resolveMediaUrl(p.image);

  return {
    id: String(p.id),
    title: p.name,
    slug: p.slug,
    brand: "",
    category: "",
    price,
    rating: 0,
    reviewCount: 0,
    image: mainImage,
    badge: p.featured ? "hot" : undefined,
    inStock: firstVar ? firstVar.in_stock : true,
    description: "",
    codAvailable: true,
    defaultSkuId: firstVar?.id,
  };
}
