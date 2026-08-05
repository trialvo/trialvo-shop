import type { Product } from "@/data/products";
import type { ProductListItem } from "@/lib/api/product/service";
import type { CompareSlot } from "@/store/compare/types";

/**
 * Map a storefront UI Product into a compare slot.
 * Product.id is a string in the UI layer — coerce safely to a positive int.
 */
export function productToCompareSlot(product: Product): CompareSlot | null {
  const id = Number(product.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    name: product.title,
    slug: product.slug,
    thumbnail: product.image,
    images: product.image
      ? [{ id: 0, path: product.image, serial: 0 }]
      : [],
    price_range: {
      min: product.price,
      max: product.originalPrice ?? product.price,
      has_discount: Boolean(
        product.originalPrice && product.originalPrice > product.price,
      ),
    },
  };
}

/** Narrow a ProductListItem to the fields we persist in compare slots. */
export function listItemToCompareSlot(item: ProductListItem): CompareSlot {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    images: item.images ?? [],
    thumbnail: item.thumbnail,
    price_range: item.price_range,
    variations: item.variations,
  };
}
