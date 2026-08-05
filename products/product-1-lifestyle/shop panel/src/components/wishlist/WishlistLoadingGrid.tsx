"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CARD_CLASSES } from "@/lib/theme";

export function WishlistLoadingGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className={`group relative flex flex-col ${CARD_CLASSES}`}
        >
          <Skeleton className="aspect-[3/4] rounded-none" />
          <div className="p-3.5 flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
