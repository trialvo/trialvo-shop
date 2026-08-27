"use client";

import AddToCompareButton from "@/components/compare/AddToCompareButton";
import type { CompareSlot } from "@/hooks/useCompareStore";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiHeart } from "react-icons/fi";

type ProductCardActionsProps = {
  isFavorite: boolean;
  wishlistLabel: string;
  onWishlist?: () => void;
  compareProduct?: CompareSlot;
};

const ProductCardActions: React.FC<ProductCardActionsProps> = ({
  isFavorite,
  wishlistLabel,
  onWishlist,
  compareProduct,
}) => {
  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
      {compareProduct ? (
        <AddToCompareButton product={compareProduct} variant="icon" />
      ) : null}

      <button
        type="button"
        aria-label={wishlistLabel}
        aria-pressed={isFavorite}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onWishlist?.();
        }}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-[4px] border border-black/10 bg-white text-black shadow-sm transition-colors",
          "hover:border-black",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40",
        )}
      >
        <FiHeart
          className={cn("h-4 w-4", isFavorite && "fill-black")}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
};

export default ProductCardActions;
