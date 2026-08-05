import type { CompareProductDetail } from "@/lib/api/product/service";

export type BetterFlags = {
  price: boolean;
  variants: boolean;
  stock: boolean;
  units: boolean;
  delivery: boolean;
  sell: boolean;
};

export const EMPTY_BETTER: BetterFlags = {
  price: false,
  variants: false,
  stock: false,
  units: false,
  delivery: false,
  sell: false,
};

/** Pure helper — which side wins each compare metric. */
export function computeBetterFlags(
  left: CompareProductDetail | null,
  right: CompareProductDetail | null,
): { left: BetterFlags; right: BetterFlags } {
  if (!left || !right) {
    return { left: EMPTY_BETTER, right: EMPTY_BETTER };
  }

  const leftBetter: BetterFlags = {
    price:
      (left.summary.min_price ?? Infinity) <
      (right.summary.min_price ?? Infinity),
    variants: left.summary.total_variations > right.summary.total_variations,
    stock: left.summary.total_in_stock > right.summary.total_in_stock,
    units: left.summary.total_stock > right.summary.total_stock,
    delivery: left.free_delivery && !right.free_delivery,
    sell: left.sell_count > right.sell_count,
  };

  const rightBetter: BetterFlags = {
    price:
      (right.summary.min_price ?? Infinity) <
      (left.summary.min_price ?? Infinity),
    variants: right.summary.total_variations > left.summary.total_variations,
    stock: right.summary.total_in_stock > left.summary.total_in_stock,
    units: right.summary.total_stock > left.summary.total_stock,
    delivery: right.free_delivery && !left.free_delivery,
    sell: right.sell_count > left.sell_count,
  };

  return { left: leftBetter, right: rightBetter };
}
