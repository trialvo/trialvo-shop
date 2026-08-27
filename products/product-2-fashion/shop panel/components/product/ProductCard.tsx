"use client";

import type { CompareSlot } from "@/hooks/useCompareStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";
import ProductCardActions from "./ProductCardActions";
import ProductImage from "./ProductImage";
import ProductInfo from "./ProductInfo";

interface ProductCardProps {
  title: string;
  price: number;
  oldPrice?: number;
  isFavorite: boolean;
  imageSrc: string;
  href: string;
  onQuickAdd?: () => void;
  onWishlist?: () => void;
  className?: string;
  priority?: boolean;
  avgRating?: number;
  reviewCount?: number;
  compareProduct?: CompareSlot;
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  oldPrice,
  imageSrc,
  isFavorite,
  href,
  onQuickAdd,
  onWishlist,
  className,
  priority = false,
  avgRating,
  reviewCount,
  compareProduct,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const goToDetails = React.useCallback(() => {
    router.push(href);
  }, [router, href]);

  return (
    <article
      className={cn("group w-full cursor-pointer", className)}
      role="link"
      tabIndex={0}
      onClick={goToDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetails();
        }
      }}
      aria-label={title}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <ProductImage
          src={imageSrc}
          alt={title}
          priority={priority}
          onQuickAdd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickAdd?.();
          }}
        />

        <ProductCardActions
          isFavorite={isFavorite}
          wishlistLabel={t("productCard.addToWishlist")}
          onWishlist={onWishlist}
          compareProduct={compareProduct}
        />
      </div>

      <ProductInfo
        title={title}
        price={price}
        oldPrice={oldPrice}
        avgRating={avgRating}
        reviewCount={reviewCount}
      />
    </article>
  );
};

export default ProductCard;
