"use client";

import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";
import SectionHeader from "../extra/SectionHeader";

const Lines: React.FC<{
  count?: number;
  className?: string;
  lineClassName?: string;
}> = ({ count = 3, className, lineClassName }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={[
            "h-4 rounded-none",
            i === count - 1 ? "w-3/5" : "w-full",
            lineClassName ?? "",
          ].join(" ")}
        />
      ))}
    </div>
  );
};

const ProductExtraSectionsSkeleton: React.FC = () => {
  return (
    <div className="w-full">
      <section className="w-full">
        <SectionHeader title="Description" />

        <div className="mt-4 space-y-6">
          <Lines count={4} className="space-y-2" />

          <div className="space-y-3">
            <Skeleton className="h-4 w-2/5 rounded-none" />
            <Skeleton className="h-4 w-1/3 rounded-none" />

            <div className="space-y-2 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="mt-1 h-4 w-4 rounded-none" />
                  <Skeleton className="h-4 w-[70%] rounded-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-none" />
            <Skeleton className="h-4 w-4/5 rounded-none" />
          </div>
        </div>
      </section>

      <section className="w-full pt-8">
        <div className="flex justify-center">
          <div className="w-full overflow-hidden border border-[#E5E5E5] bg-white">
            <Skeleton className="h-[260px] w-full rounded-none sm:h-[320px] md:h-[380px]" />
          </div>
        </div>
      </section>

      <section className="w-full pt-10">
        <SectionHeader title="Shipping Policy" />
        <div className="mt-4 space-y-2">
          <Lines count={3} className="space-y-2" />
        </div>
      </section>
    </div>
  );
};

export default ProductExtraSectionsSkeleton;
