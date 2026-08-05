import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ProductCardSkeletonProps = Readonly<{
  className?: string;
}>;

/**
 * Loading placeholder that mirrors `ProductCard` layout
 * (image → brand → title → rating → price).
 */
export function ProductCardSkeleton({
  className,
}: ProductCardSkeletonProps): ReactElement {
  return (
    <div
      className={cn(
        "h-full overflow-hidden rounded-sm border border-border bg-card shadow-product",
        className,
      )}
      aria-hidden
    >
      <div className="relative aspect-square bg-secondary/30">
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute left-2 top-2">
          <Skeleton className="h-4 w-12 rounded-sm" />
        </div>
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <Skeleton className="h-7 w-7 rounded-sm" />
          <Skeleton className="h-7 w-7 rounded-sm" />
        </div>
      </div>

      <div className="space-y-2 p-3">
        <Skeleton className="h-2.5 w-1/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
