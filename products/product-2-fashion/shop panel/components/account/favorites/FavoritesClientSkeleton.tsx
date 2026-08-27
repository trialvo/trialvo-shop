import * as React from "react";

import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesClientSkeleton(): React.ReactElement {
  const items = Array.from({ length: 8 });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-[#E5E5E5] pb-3">
        <Skeleton className="h-7 w-36 rounded-sm" />
        <Skeleton className="h-9 w-48 rounded-sm" />
      </div>

      <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white p-3 min-[768px]:p-4">
        <div className="grid grid-cols-2 gap-3 gap-y-4 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
          {items.map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
