"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as React from "react";

export type ProductHeroSkeletonProps = {
  variant?: "overlay" | "below";
  heightClassName?: string;
  className?: string;
  rounded?: boolean;
};

const ProductHeroSkeleton: React.FC<ProductHeroSkeletonProps> = ({
  variant = "overlay",
  heightClassName = "h-[260px]",
  className,
  rounded = false,
}) => {
  const radius = rounded ? "rounded-xl" : "rounded-none";

  if (variant === "below") {
    return (
      <div className={cn("w-full", className)}>
        <div
          className={cn(
            "relative w-full overflow-hidden border border-[#f1f1f1] bg-muted",
            heightClassName,
            radius,
          )}
        >
          <Skeleton className="h-full w-full" />
        </div>

        <div className="mt-0.5 sm:mt-2 inline-flex items-center gap-2">
          <Skeleton className="h-3 w-20 sm:h-5 sm:w-32" />
          <Skeleton className="h-3 w-3 rounded-full sm:h-6 sm:w-6" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-black", radius, className)}>
      <div className="absolute inset-0">
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      <div className={cn("relative z-10 flex flex-col justify-between p-6 sm:p-10", heightClassName)}>
        <div>
          <Skeleton className="h-12 w-56 sm:h-14 sm:w-80" />
          <Skeleton className="mt-4 h-4 w-72 sm:w-[420px]" />
          <Skeleton className="mt-2 h-4 w-60 sm:w-[360px]" />
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHeroSkeleton;
