"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FiHeart } from "react-icons/fi";
import ProductImage from "./ProductImage";
import ProductInfo from "./ProductInfo";
import { useTranslation } from "@/hooks/useTranslation";

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

        <button
          type="button"
          aria-label={t("productCard.addToWishlist")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlist?.();
          }}
          className="absolute bottom-12 right-2 z-20 grid h-8 w-8 place-items-center text-white drop-shadow transition-transform hover:scale-110"
        >
          <FiHeart
            className={cn("h-4 w-4", isFavorite && "fill-white")}
            strokeWidth={1.5}
          />
        </button>
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
