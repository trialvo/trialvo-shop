"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

type Props = {
  className?: string;
};

const AddressBookCardSkeleton: React.FC<Props> = ({ className }) => {
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
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-7 w-20 rounded-none" />
      </div>

      <div className="pb-3">
        <Skeleton className="mt-2 h-3 w-28" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-none" />
        </div>

        <div className="mt-3">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-1 h-3 w-32" />
        </div>

      </div>
    </Card>
  );
};

export default AddressBookCardSkeleton;
