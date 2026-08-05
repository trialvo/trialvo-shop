"use client";

import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderListSkeleton({
  rows = 4,
}: Readonly<{ rows?: number }>): ReactElement {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 p-3 rounded-sm border border-border"
        >
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-28 rounded-sm" />
            <Skeleton className="h-3 w-40 rounded-sm" />
          </div>
          <div className="space-y-2 text-right shrink-0">
            <Skeleton className="h-4 w-16 rounded-sm ml-auto" />
            <Skeleton className="h-5 w-20 rounded-full ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
