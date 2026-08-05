"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = {
  className?: string;
};

const FeatureProductHeaderSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={cn(
        "w-full mt-20 max-[501px]:mt-3 border-t border-[#F1F1F1] bg-white pt-4 pb-8",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 text-center">
        <div className="flex justify-center">
          <Skeleton className="h-8 w-64 max-[501px]:h-7 max-[501px]:w-52 rounded-none bg-muted/60" />
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <Skeleton className="h-4 w-20 rounded-none bg-muted/60" />
          <Skeleton className="h-5 w-5 rounded-none bg-muted/60" />
        </div>
      </div>
    </div>
  );
};

export default FeatureProductHeaderSkeleton;
