"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

type Props = {
  className?: string;
};

const PersonalProfileCardSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <Card
      className={[
        "rounded-none border-0 bg-white p-4! shadow-[0px_0px_10px_rgba(0,0,0,0.12)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-7 w-20 rounded-none" />
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-[130px_1fr] gap-y-4 text-sm">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-52" />

          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-64" />

          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />

          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />

          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
};

export default PersonalProfileCardSkeleton;
