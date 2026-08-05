import type { ProductVariationDetail } from "@/lib/api/product/service";

/**
 * Resolve the SKU row for the selected color + variant combination.
 */
export function pickVariation(
  variations: ProductVariationDetail[],
  colorId: number | null,
  variantId: number | null,
): ProductVariationDetail | null {
  if (!variations.length) return null;

  const match = variations.find((v) => {
    const colorOk = colorId == null || v.color?.id === colorId;
    const variantOk = variantId == null || v.variant?.id === variantId;
    return colorOk && variantOk;
  });

  return match ?? variations[0] ?? null;
}
