"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  className?: string;
};

const AddressSelectableCardSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between border border-[#EDEDED] px-4 py-4">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-1 h-5 w-5 rounded-full" />

          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-none" />

            <Skeleton className="h-4 w-40 rounded" />

            <Skeleton className="h-4 w-28 rounded" />

            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10">
        <Skeleton className="h-5 w-24 rounded-none" />
      </div>

      <div className="absolute bottom-2 right-4 z-10 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-none" />
        <Skeleton className="h-9 w-9 rounded-none" />
      </div>
    </div>
  );
};

export default AddressSelectableCardSkeleton;
