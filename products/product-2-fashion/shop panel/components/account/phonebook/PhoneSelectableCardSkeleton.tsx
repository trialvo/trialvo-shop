"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  className?: string;
};

const PhoneSelectableCardSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between border border-gray-400 px-4 py-4">
        <div className="flex items-start gap-3">
          <Skeleton className="mt-1 h-4 w-4 rounded-full" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36" />

              <Skeleton className="h-5 w-20 rounded-none" />

              <Skeleton className="h-7 w-16 rounded-none" />
            </div>
          </div>
        </div>

        <Skeleton className="h-6 w-6 opacity-0" />
      </div>

      <div className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-3">
        <Skeleton className="h-7 w-24 rounded-none" />

        <Skeleton className="h-8 w-8 rounded-[2px]" />
      </div>
    </div>
  );
};

export default PhoneSelectableCardSkeleton;
