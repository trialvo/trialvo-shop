import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder while auth user / counts settle.
 */
export function AccountSidebarSkeleton(): ReactElement {
  return (
    <aside className="md:w-64 shrink-0" aria-hidden>
      <div className="sticky top-32 overflow-hidden rounded-sm border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border p-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 py-0.5">
            <Skeleton className="h-3.5 w-28 rounded-sm" />
            <Skeleton className="h-3 w-36 rounded-sm" />
            <Skeleton className="h-2.5 w-20 rounded-sm" />
          </div>
        </div>
        <div className="space-y-1.5 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-sm" />
          ))}
          <Skeleton className="mt-1 h-9 w-full rounded-sm" />
        </div>
      </div>
    </aside>
  );
}
