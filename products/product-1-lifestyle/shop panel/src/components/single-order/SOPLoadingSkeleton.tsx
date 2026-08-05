"use client";

/**
 * components/single-order/SOPLoadingSkeleton.tsx — Loading state skeleton
 */

export function SOPLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Skeleton header */}
      <div className="h-16 bg-card border-b border-border" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="sm:mt-4 mb-4 sm:mb-10 grid grid-cols-1 gap-4 sm:gap-10 md:grid-cols-12">
          {/* Gallery skeleton */}
          <div className="md:col-span-6">
            <div className="aspect-square animate-pulse bg-secondary border border-border rounded" />
          </div>
          {/* Info skeleton */}
          <div className="md:col-span-6 space-y-5">
            <div className="h-6 w-3/4 animate-pulse bg-secondary rounded" />
            <div className="h-5 w-1/3 animate-pulse bg-secondary rounded" />
            <div className="h-4 w-1/2 animate-pulse bg-secondary rounded" />
            <div className="h-10 w-full animate-pulse bg-secondary rounded" />
            <div className="h-10 w-full animate-pulse bg-secondary rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
