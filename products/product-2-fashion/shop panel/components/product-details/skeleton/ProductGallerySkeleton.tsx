"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  className?: string;
};

const ProductGallerySkeleton: React.FC<Props> = ({ className }) => {
  const isMobile = useIsMobile();

  const thumbs = 5;

  return (
    <div
      className={cn(
        "flex gap-4",
        isMobile ? "flex-col col-span-12" : "flex-row col-span-6",
        className,
      )}
      aria-busy="true"
      aria-label="Loading product images"
    >
      <div className={cn(isMobile ? "order-2 w-full" : "order-1 w-20")}>
        <div
          className={cn(
            "relative",
            isMobile ? "flex flex-row gap-2" : "flex flex-col gap-2",
          )}
        >
          {Array.from({ length: thumbs }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "relative h-20 w-20 overflow-hidden border bg-white",
                "border-[#D9D9D9]",
              )}
            >
              <Skeleton className="h-full w-full" />
            </div>
          ))}

          <div
            className={cn(
              "absolute z-10",
              isMobile
                ? "left-2 top-1/2 -translate-y-1/2"
                : "top-2 left-1/2 -translate-x-1/2",
            )}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div
            className={cn(
              "absolute z-10",
              isMobile
                ? "right-2 top-1/2 -translate-y-1/2"
                : "bottom-2 left-1/2 -translate-x-1/2",
            )}
          >
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden border border-[#F1F1F1] bg-white",
          isMobile ? "order-1 h-[75vw] w-full" : "order-2 h-128 w-full",
        )}
      >
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
};

export default ProductGallerySkeleton;
