"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import * as React from "react";
import { FiHeart } from "react-icons/fi";
import ProductImage from "./ProductImage";
import ProductInfo from "./ProductInfo";
import { useTranslation } from "@/hooks/useTranslation";

interface ProductCardProps {
  title: string;
  price: number;
  oldPrice?: number;
  isFavorite: boolean;
  imageSrc: string;
  href: string;
  onQuickAdd?: () => void;
  onWishlist?: () => void;
  priority?: boolean;
  avgRating?: number;
  reviewCount?: number;
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
      className="group w-full cursor-pointer"
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

        <button
          type="button"
          aria-label={t("productCard.addToWishlist")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlist?.();
          }}
          className={cn(
            "absolute right-2 z-20 grid h-8 w-8 place-items-center text-white drop-shadow transition-all duration-300 hover:scale-110",
            "bottom-2 group-hover:bottom-12",
          )}
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

export default ProductCard;
