"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as React from "react";

type ProductCardSkeletonProps = {
  className?: string;
  imageClassName?: string;
  infoClassName?: string;
  showWishlist?: boolean;
  showQuickAddBar?: boolean;
};

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  className,
  imageClassName,
  infoClassName,
  showWishlist = true,
  showQuickAddBar = true,
}) => {
  return (
    <article className={cn("group", className)} aria-label="Loading product">
      <div className={cn("relative h-72.75 w-72.75", imageClassName)}>
        <Skeleton className="h-full w-full rounded-none" />

        {showWishlist ? (
          <div className="absolute right-2 top-2">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        ) : null}

        {showQuickAddBar ? (
          <div className="absolute inset-x-0 bottom-0">
            <Skeleton className="h-11 w-full rounded-none" />
          </div>
        ) : null}
      </div>

      <div className={cn("mt-3 space-y-2", infoClassName)}>
        <Skeleton className="h-4 w-[85%]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </article>
  );
};

export default ProductCardSkeleton;
