import { IMAGE_URL } from "@/config/env";
import type {
  ProductListItem,
  ProductVariationListItem,
} from "@/lib/api/product/service";
import type { Product, ProductColor } from "@/types";

export type WishlistProduct = Product & {
  productVariationId?: number;
  stock: number;
  originalPrice: number;
  weightKg: number;
  freeDelivery: boolean;
};

type ProductListItemMeta = ProductListItem & {
  category_name?: string | null;
  main_category_name?: string | null;
  sub_category_name?: string | null;
  child_category_name?: string | null;
  sizes?: string[];
  colors?: Array<string | { name?: string | null; hex?: string | null; value?: string | null }>;
  available_colors?: Array<{ name?: string | null; hex?: string | null; value?: string | null }>;
  available_variants?: Array<{ name?: string | null }>;
};

type ProductVariationMeta = ProductVariationListItem & {
  color?: { name?: string | null; hex?: string | null };
  variant?: { name?: string | null };
  weight_kg?: number | string | null;
  free_delivery?: boolean | number | null;
};

const isFilledString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dedupeStrings = (items: string[]): string[] =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const toImageUrl = (path: string | null | undefined): string => {
  const value = path?.trim();
  if (!value) return "";

  if (/^(https?:)?\/\//i.test(value) || /^(data:|blob:)/i.test(value)) {
    return value;
  }

  return `${IMAGE_URL.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
};

const getProductImages = (product: ProductListItem): string[] =>
  dedupeStrings([
    toImageUrl(product.thumbnail),
    ...product.images.map((image) => toImageUrl(image.path)),
  ]);

const getProductCategoryName = (product: ProductListItemMeta): string =>
  product.child_category_name ??
  product.sub_category_name ??
  product.main_category_name ??
  product.category_name ??
  "Fashion";

const getProductSizes = (product: ProductListItemMeta): string[] => {
  const variationSizes = product.variations
    .map((variation) => (variation as ProductVariationMeta).variant?.name)
    .filter(isFilledString);

  return dedupeStrings([
    ...(product.sizes ?? []),
    ...((product.available_variants ?? [])
      .map((variant) => variant.name)
      .filter(isFilledString)),
    ...variationSizes,
  ]);
};

const getProductColors = (product: ProductListItemMeta): ProductColor[] => {
  const colors = new Map<string, ProductColor>();

  const addColor = (name: string | null | undefined, value?: string | null) => {
    if (!isFilledString(name)) return;
    const normalizedName = name.trim();
    const key = normalizedName.toLowerCase();
    if (colors.has(key)) return;

    colors.set(key, {
      name: normalizedName,
      value: isFilledString(value) ? value.trim() : "#d1d5db",
    });
  };

  product.colors?.forEach((color) => {
    if (typeof color === "string") {
      addColor(color);
      return;
    }
    addColor(color.name, color.hex ?? color.value);
  });

  product.available_colors?.forEach((color) => addColor(color.name, color.hex ?? color.value));
  product.variations.forEach((variation) => {
    const variationMeta = variation as ProductVariationMeta;
    addColor(variationMeta.color?.name, variationMeta.color?.hex);
  });

  return Array.from(colors.values());
};

const getPreferredVariation = (
  variations: ProductVariationListItem[],
): ProductVariationMeta | undefined =>
  (variations.find((variation) => variation.stock > 0) as ProductVariationMeta | undefined) ??
  (variations[0] as ProductVariationMeta | undefined);

export const normalizeWishlistProduct = (
  product: ProductListItem,
): WishlistProduct => {
  const productMeta = product as ProductListItemMeta;
  const preferredVariation = getPreferredVariation(product.variations);
  const finalPrice = toNumber(
    preferredVariation?.final_price,
    product.price_range?.min ?? preferredVariation?.selling_price ?? 0,
  );
  const originalPrice = toNumber(
    preferredVariation?.selling_price,
    product.price_range?.max ?? finalPrice,
  );
  const hasDiscount = originalPrice > finalPrice;
  const images = getProductImages(product);
  const mainImage = images[0] ?? "";
  const sizes = getProductSizes(productMeta);
  const colors = getProductColors(productMeta);
  const stock = Math.max(0, toNumber(preferredVariation?.stock));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: finalPrice,
    oldPrice: hasDiscount ? originalPrice : null,
    badge: product.featured ? "HOT" : hasDiscount ? "SALE" : null,
    image: mainImage,
    images: images.length ? images : [mainImage],
    category: getProductCategoryName(productMeta),
    description: "",
    details: [],
    sizes: sizes.length ? sizes : ["One Size"],
    colors,
    rating: product.avg_rating ?? 0,
    reviewCount: product.review_count ?? 0,
    inStock: stock > 0,
    productVariationId: preferredVariation?.id,
    stock,
    originalPrice,
    weightKg: toNumber(preferredVariation?.weight_kg),
    freeDelivery: preferredVariation?.free_delivery === true || preferredVariation?.free_delivery === 1,
  };
};

export const normalizeWishlistProducts = (
  products: ProductListItem[],
): WishlistProduct[] =>
  products
    .filter((product) => product.is_favourite === true)
    .map(normalizeWishlistProduct);
