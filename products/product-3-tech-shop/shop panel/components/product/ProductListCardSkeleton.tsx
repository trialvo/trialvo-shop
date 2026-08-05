import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ProductListCardSkeletonProps = Readonly<{
  className?: string;
}>;

/**
 * Loading placeholder that mirrors `ProductListCard` layout
 * (thumb + brand/title/rating/price row).
 */
export function ProductListCardSkeleton({
  className,
}: ProductListCardSkeletonProps): ReactElement {
  return (
    <div
      className={cn(
        "flex gap-3 overflow-hidden rounded-sm border border-border bg-card p-3 shadow-product md:gap-4",
        className,
      )}
      aria-hidden
    >
      <Skeleton className="aspect-square w-28 shrink-0 rounded-sm md:w-44" />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-0.5">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-1/5" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3.5 w-3/5" />
          <div className="flex items-center gap-1.5 pt-0.5">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="hidden space-y-1 md:block">
            <Skeleton className="h-2.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3.5 w-12" />
          </div>
          <Skeleton className="h-8 w-24 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export default ProductListCardSkeleton;
