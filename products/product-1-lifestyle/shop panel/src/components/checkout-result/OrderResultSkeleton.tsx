"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page skeleton shown while the order detail API request is in-flight.
 * Mirrors the two-column layout of the success / failed pages.
 */
export function OrderResultSkeleton() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Left column */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-14 rounded-2xl bg-secondary" />
            <Skeleton className="h-7 w-64 rounded-xl bg-secondary" />
            <Skeleton className="h-4 w-3/4 rounded-lg bg-secondary" />
            <Skeleton className="h-4 w-1/2 rounded-lg bg-secondary" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-lg bg-secondary" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-lg bg-secondary" />
              <Skeleton className="h-4 w-5/6 rounded-lg bg-secondary" />
              <Skeleton className="h-4 w-4/6 rounded-lg bg-secondary" />
              <Skeleton className="h-4 w-3/6 rounded-lg bg-secondary" />
            </div>
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-xl bg-secondary" />
            <Skeleton className="h-10 w-44 rounded-xl bg-secondary" />
          </div>
        </div>

        {/* Right column */}
        <div className="w-full lg:w-[400px] space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 rounded-lg bg-secondary" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded bg-secondary" />
                  <Skeleton className="h-3.5 w-20 rounded bg-secondary" />
                </div>
              ))}
            </div>
          </div>

          <Skeleton className="h-px w-full bg-border/50" />

          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-xl bg-secondary" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32 rounded bg-secondary" />
                  <Skeleton className="h-3 w-20 rounded bg-secondary" />
                </div>
                <Skeleton className="h-3.5 w-16 rounded bg-secondary" />
              </div>
            ))}
          </div>

          <Skeleton className="h-px w-full bg-border/50" />

          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3.5 w-24 rounded bg-secondary" />
                <Skeleton className="h-3.5 w-20 rounded bg-secondary" />
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <Skeleton className="h-5 w-28 rounded bg-secondary" />
              <Skeleton className="h-5 w-24 rounded bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
