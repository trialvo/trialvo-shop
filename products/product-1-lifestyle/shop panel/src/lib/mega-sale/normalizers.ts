import { IMAGE_URL } from "@/config/env";
import type { MegaSaleProductItem } from "@/lib/api/storefront/service";
import type { Product } from "@/types";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export type MegaSaleProduct = Product & {
  productVariationId: number;
  stock: number;
  salePrice: number;
  originalPrice: number;
  discount: number;
  productEndAt: string | null;
};

const toNonNegativeNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const toPositiveInteger = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
};

const toNonEmptyString = (value: unknown, fallback: string): string => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
};

const toImageUrl = (path: string | null | undefined): string => {
  const value = path?.trim();
  if (!value) return PLACEHOLDER_IMAGE;

  if (value.startsWith("/")) {
    return `${IMAGE_URL.replace(/\/+$/, "")}${value}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return `${IMAGE_URL.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
  }

  return PLACEHOLDER_IMAGE;
};

const calculateDiscountPercent = (
  originalPrice: number,
  salePrice: number,
  discountPercent: unknown,
): number => {
  const explicitDiscount = Math.round(toNonNegativeNumber(discountPercent));
  if (explicitDiscount > 0) return Math.min(explicitDiscount, 99);

  if (originalPrice <= salePrice || originalPrice <= 0) return 0;
  return Math.min(Math.round(((originalPrice - salePrice) / originalPrice) * 100), 99);
};

export const normalizeMegaSaleProduct = (
  item: MegaSaleProductItem,
): MegaSaleProduct => {
  const id = toPositiveInteger(item.id);
  const name = toNonEmptyString(item.name, "Mega Sale Product");
  const slug = toNonEmptyString(item.slug, String(id));
  const stock = toNonNegativeNumber(item.stock);
  const salePrice = toNonNegativeNumber(item.final_price);
  const originalPrice = toNonNegativeNumber(item.selling_price ?? item.final_price);
  const discount = calculateDiscountPercent(
    originalPrice,
    salePrice,
    item.discount_percent,
  );
  const colorName = item.color_name?.trim() ?? "";
  const variantName = item.variant_name?.trim() ?? "One Size";

  return {
    id,
    slug,
    name,
    price: salePrice,
    oldPrice: originalPrice > salePrice ? originalPrice : null,
    badge: discount > 0 ? "SALE" : "MEGA",
    image: toImageUrl(item.thumbnail),
    images: [toImageUrl(item.thumbnail)],
    category: "Mega Sale",
    description: "",
    details: [],
    sizes: [variantName],
    colors: colorName ? [{ name: colorName, value: "#e5e7eb" }] : [],
    rating: 0,
    reviewCount: 0,
    inStock: stock > 0,
    productVariationId: toPositiveInteger(item.product_sku_id),
    stock,
    salePrice,
    originalPrice,
    discount,
    productEndAt: item.product_end_at,
  };
};

export const normalizeMegaSaleProducts = (
  items: MegaSaleProductItem[],
): MegaSaleProduct[] =>
  items
    .map(normalizeMegaSaleProduct)
    .filter((product) => product.id > 0 && product.slug.length > 0);
