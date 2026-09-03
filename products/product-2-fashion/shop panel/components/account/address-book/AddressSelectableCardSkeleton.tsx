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
        "flex gap-3 rounded-md border border-[#E5E5E5] px-4 py-4",
        className,
      )}
    >
      <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-7 w-[88px] rounded-full" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-5 w-[76px] rounded-full" />
          <Skeleton className="h-7 w-[58px] rounded-full" />
        </div>

        <Skeleton className="h-4 w-full max-w-md rounded" />
        <Skeleton className="h-4 w-4/5 max-w-sm rounded" />

        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-8 w-[52px] rounded-full" />
          <Skeleton className="h-8 w-[68px] rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default AddressSelectableCardSkeleton;
