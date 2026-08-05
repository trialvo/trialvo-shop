"use client";

import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function WishlistSkeleton({
  count = 6,
}: Readonly<{ count?: number }>): ReactElement {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
      aria-busy="true"
      aria-label="Loading wishlist"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-sm border border-border overflow-hidden bg-card"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-16 rounded-sm" />
            <Skeleton className="h-4 w-full rounded-sm" />
            <Skeleton className="h-4 w-24 rounded-sm" />
            <Skeleton className="h-4 w-20 rounded-sm" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 flex-1 rounded-sm" />
              <Skeleton className="h-8 w-8 rounded-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
