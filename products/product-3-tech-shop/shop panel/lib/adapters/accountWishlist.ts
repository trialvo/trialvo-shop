import type { Product } from "@/data/products";
import { sanitizeAuthText } from "@/lib/security/auth";

export type WishlistItemViewModel = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  image: string;
  priceLabel: string;
  originalPriceLabel: string | null;
  discountLabel: string | null;
  inStock: boolean;
  ratingLabel: string;
  product: Product;
};

/**
 * Map UI Product → wishlist card presentation fields.
 */
export function toWishlistItemViewModel(product: Product): WishlistItemViewModel {
  const title = sanitizeAuthText(product.title ?? "", 160);
  const brand = sanitizeAuthText(product.brand ?? "", 80);
  const price = Number.isFinite(product.price) ? product.price : 0;
  const original =
    typeof product.originalPrice === "number" &&
    Number.isFinite(product.originalPrice) &&
    product.originalPrice > price
      ? product.originalPrice
      : null;

  return {
    id: String(product.id),
    title: title || "Product",
    slug: product.slug || product.id,
    brand: brand || "Brand",
    image: product.image || "/placeholder.jpg",
    priceLabel: `৳${price.toLocaleString()}`,
    originalPriceLabel: original ? `৳${original.toLocaleString()}` : null,
    discountLabel:
      typeof product.discount === "number" && product.discount > 0
        ? `-${product.discount}%`
        : null,
    inStock: Boolean(product.inStock),
    ratingLabel: `${product.rating ?? 0} (${product.reviewCount ?? 0})`,
    product,
  };
}
