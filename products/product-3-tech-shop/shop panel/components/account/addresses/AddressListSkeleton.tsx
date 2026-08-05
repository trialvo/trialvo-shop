"use client";

import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AddressListSkeleton({
  rows = 3,
}: Readonly<{ rows?: number }>): ReactElement {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading addresses">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-sm border border-border"
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-36 rounded-sm" />
            </div>
            <Skeleton className="h-5 w-14 rounded-sm shrink-0" />
          </div>
          <div className="space-y-2 border-t border-border/70 px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-full max-w-md rounded-sm" />
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="h-3 w-32 rounded-sm" />
          </div>
          <div className="grid grid-cols-3 border-t border-border/70">
            <Skeleton className="h-10 w-full rounded-none" />
            <Skeleton className="h-10 w-full rounded-none" />
            <Skeleton className="h-10 w-full rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
