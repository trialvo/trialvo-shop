"use client";

import type { CompareSlot } from "@/hooks/useCompareStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";
import ProductCardActions from "./ProductCardActions";
import ProductImage from "./ProductImage";
import ProductInfo from "./ProductInfo";

export type ProductCardMobileProps = {
  title: string;
  price: number;
  oldPrice?: number;
  imageSrc: string;
  isFavorite: boolean;
  href: string;
  onQuickAdd?: () => void;
  onWishlist?: () => void;
  className?: string;
  priority?: boolean;
  avgRating?: number;
  reviewCount?: number;
  compareProduct?: CompareSlot;
};

const ProductCardMobile: React.FC<ProductCardMobileProps> = ({
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
      className={cn("group cursor-pointer", className)}
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
          alwaysShowQuickAdd
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

export default ProductCardMobile;
