import type { Product } from "@/data/products";
import type { CartItem } from "@/store/cart/types";

export function resolveSkuId(
  product: Product,
  productVariationId?: number,
): number | undefined {
  if (
    typeof productVariationId === "number" &&
    Number.isFinite(productVariationId) &&
    productVariationId > 0
  ) {
    return productVariationId;
  }
  if (
    typeof product.defaultSkuId === "number" &&
    Number.isFinite(product.defaultSkuId) &&
    product.defaultSkuId > 0
  ) {
    return product.defaultSkuId;
  }
  return undefined;
}

export function sameCartLine(
  item: CartItem,
  productId: string,
  skuId?: number,
): boolean {
  if (item.product.id !== productId) return false;
  if (skuId == null && item.productVariationId == null) return true;
  return item.productVariationId === skuId;
}

export function cartLineKey(
  productId: string,
  productVariationId?: number,
): string {
  return `${productId}:${productVariationId ?? "default"}`;
}

export function findCartLine(
  items: CartItem[],
  productId: string,
  productVariationId?: number,
): CartItem | undefined {
  const skuId = productVariationId;
  return items.find((item) => sameCartLine(item, productId, skuId));
}

/** Whether this product (optionally SKU) is already in the cart. */
export function isProductInCart(
  items: CartItem[],
  product: Product,
  productVariationId?: number,
): boolean {
  const skuId = resolveSkuId(product, productVariationId);
  return items.some((item) => sameCartLine(item, product.id, skuId));
}

export function getCartLineQuantity(
  items: CartItem[],
  product: Product,
  productVariationId?: number,
): number {
  const skuId = resolveSkuId(product, productVariationId);
  return (
    items.find((item) => sameCartLine(item, product.id, skuId))?.quantity ?? 0
  );
}
