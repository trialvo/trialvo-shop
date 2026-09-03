"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  className?: string;
};

const AddressSelectableCardSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-[#E5E5E5] bg-white",
        className,
      )}
    >
      <div className="flex gap-3.5 px-4 py-4 pl-5">
        <Skeleton className="mt-1.5 h-4 w-4 shrink-0 rounded-full" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-[72px] rounded-full" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-full max-w-md rounded" />
            <Skeleton className="h-4 w-4/5 max-w-sm rounded" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#EEEEEE] bg-[#F8F8F8] px-3 py-2">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-[58px] rounded-md" />
          <Skeleton className="h-8 w-[76px] rounded-md" />
        </div>
        <Skeleton className="h-8 w-[96px] rounded-md" />
      </div>
    </div>
  );
};

export default AddressSelectableCardSkeleton;
