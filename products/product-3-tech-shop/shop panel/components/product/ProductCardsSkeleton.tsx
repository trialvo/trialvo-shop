import type { ReactElement } from "react";
import {
  ProductCardSkeleton,
} from "@/components/product/ProductCardSkeleton";
import { cn } from "@/lib/utils";

export type ProductCardsSkeletonProps = Readonly<{
  /** Number of card placeholders to render. */
  count?: number;
  /** Grid / layout classes — defaults to home & catalog 4-col pattern. */
  className?: string;
  /** Accessible label for the loading region. */
  label?: string;
}>;

/**
 * Grid of `ProductCardSkeleton` units for any ProductCard catalog surface.
 * Use this when the parent does not already own a grid wrapper.
 */
export function ProductCardsSkeleton({
  count = 4,
  className,
  label = "Loading products",
}: ProductCardsSkeletonProps): ReactElement {
  const safeCount = Math.max(1, Math.floor(count));

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4",
        className,
      )}
      aria-busy
      aria-label={label}
    >
      {Array.from({ length: safeCount }, (_, index) => (
        <ProductCardSkeleton key={`product-card-skeleton-${index}`} />
      ))}
    </div>
  );
}

export default ProductCardsSkeleton;
