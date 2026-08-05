"use client";

import { Button } from "@/components/ui/button";
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

  const imagePath = imageSrc;

  return (
    <article
      className="group transition cursor-pointer w-full"
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
      <div className="relative aspect-square">
        <ProductImage
          src={imagePath}
          alt={title}
          priority={priority}
          onQuickAdd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickAdd?.();
          }}
        />

        <Button
          type="button"
          aria-label={t("productCard.addToWishlist")}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlist?.();
          }}
          className="
            heart-drop
            absolute right-2 top-2
            h-10 w-10
            rounded-full
            border border-[#F1F1F1]
            bg-white/80
            shadow-none
            hover:bg-white/90
            focus-visible:ring-0 focus-visible:ring-offset-0
            flex items-center justify-center
            opacity-0 scale-0
            transition-[opacity,transform] duration-200 ease-out
            group-hover:opacity-100 group-hover:scale-100
          "
        >
          <FiHeart className={`h-4 w-4 sm:h-7 sm:w-7 ${isFavorite ? "text-[#E52D2D] fill-[#E52D2D]" : "text-black"}`} />
        </Button>
      </div>

      <ProductInfo title={title} price={price} oldPrice={oldPrice} avgRating={avgRating} reviewCount={reviewCount} />

      {/* Water drop keyframes */}
      <style jsx>{`
        .group:hover .heart-drop {
          animation: dropPop 420ms cubic-bezier(0.2, 0.9, 0.25, 1.25);
        }
        @keyframes dropPop {
          0% {
            transform: translateY(-10px) scale(0);
            opacity: 0;
          }
          55% {
            transform: translateY(2px) scale(1.12);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </article>
  );
};

export default ProductCard;
