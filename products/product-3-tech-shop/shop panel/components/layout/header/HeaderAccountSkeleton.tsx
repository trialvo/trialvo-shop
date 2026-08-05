import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches authenticated trigger footprint (circle + name) while profile loads.
 */
export function HeaderAccountSkeleton(): ReactElement {
  return (
    <div
      className="inline-flex items-center gap-2 h-9 px-1"
      aria-hidden
      aria-busy="true"
    >
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <Skeleton className="hidden sm:block h-3.5 w-16 rounded-sm" />
    </div>
  );
}

export default HeaderAccountSkeleton;
