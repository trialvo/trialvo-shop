"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as React from "react";

export type ProductCardMobileSkeletonProps = {
  className?: string;
  imageClassName?: string;
  infoClassName?: string;
  showWishlist?: boolean;
  showQuickAddButton?: boolean;
};

const ProductCardMobileSkeleton: React.FC<ProductCardMobileSkeletonProps> = ({
  className,
  imageClassName,
  infoClassName,
  showWishlist = true,
  showQuickAddButton = true,
}) => {
  return (
    <article className={cn("w-full", className)} aria-label="Loading product">
      <div className="relative">
        <div className={cn("relative h-43.75 w-full", imageClassName)}>
          <Skeleton className="h-full w-full rounded-none" />

          {showWishlist ? (
            <div className="absolute right-2 top-2">
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : null}
        </div>
      </div>

      <div className={cn("mt-2", infoClassName)}>
        <Skeleton className="h-4 w-[85%]" />

        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>

        {showQuickAddButton ? (
          <Skeleton className="mt-2 h-9 w-full rounded-none" />
        ) : null}
      </div>
    </article>
  );
};

export default ProductCardMobileSkeleton;
