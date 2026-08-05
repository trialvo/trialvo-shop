"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MegaSaleProduct } from "@/lib/mega-sale/normalizers";

import { MegaSaleNotice } from "./MegaSaleNotice";
import { MegaSaleProductCard } from "./MegaSaleProductCard";

interface MegaSaleProductGridProps {
  products: MegaSaleProduct[];
  isLoading: boolean;
  isError: boolean;
  showMegaSale: boolean;
  onRetry: () => void;
}

export function MegaSaleProductGrid({
  products,
  isLoading,
  isError,
  showMegaSale,
  onRetry,
}: MegaSaleProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (<div key={index}><Skeleton className="aspect-[3/4]" /><Skeleton className="h-4 w-3/4 mt-3" /><Skeleton className="h-4 w-1/3 mt-1" /></div>))}
      </div>
    );
  }

  if (isError) {
    return (
      <MegaSaleNotice
        title="Unable to load mega sale"
        description="Please try again in a moment."
        actionLabel="Retry"
        onAction={onRetry}
      />
    );
  }

  if (!showMegaSale) {
    return (
      <MegaSaleNotice
        title="Mega Sale unavailable"
        description="The current campaign is not active right now."
      />
    );
  }

  if (products.length === 0) {
    return (
      <MegaSaleNotice
        title="No sale products found"
        description="There are no products available for the selected filter."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {products.map((product) => (
        <MegaSaleProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
