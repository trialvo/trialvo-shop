"use client";

import { Button } from "@/components/ui/button";
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
    const [wishPulse, setWishPulse] = React.useState(false);
    const { t } = useTranslation();

    const goToDetails = React.useCallback(() => {
        router.push(href);
    }, [router, href]);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickAdd?.();
    }

    const handleWishlist = React.useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // keep a small "drop pop" feel on tap
            setWishPulse(true);
            window.setTimeout(() => setWishPulse(false), 420);

            onWishlist?.();
        },
        [onWishlist],
    );

    return (
        <article
            className={cn("cursor-pointer", className)}
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
            <div className="">
                <div className="relative">
                    <ProductImage src={imageSrc} alt={title} priority={priority} />

                    <button
                        type="button"
                        aria-label={t("productCard.addToWishlist")}
                        onClick={handleWishlist}
                        className={cn(
                            "absolute right-2 top-2 cursor-pointer",
                            "grid h-7 w-7 place-items-center rounded-full",
                            "bg-white/95 border border-[#F1F1F1]",
                            "shadow-[0_8px_22px_rgba(0,0,0,0.10)]",
                            wishPulse && "heart-drop",
                        )}
                    >
                        <FiHeart className={`h-4 w-4 sm:h-7 sm:w-7 ${isFavorite ? "text-[#E52D2D] fill-[#E52D2D]" : "text-black"}`} />
                    </button>
                </div>

                <div className="">
                    <ProductInfo title={title} price={price} oldPrice={oldPrice} avgRating={avgRating} reviewCount={reviewCount} />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleQuickAdd}
                        className={cn(
                            "mt-2 h-9 w-full rounded-none",
                            "border border-[#999999] bg-white",
                            "text-sm font-medium text-[#272727]",
                            "hover:bg-white",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                        )}
                    >
                        {t("productCard.quickAdd")}
                    </Button>
                </div>
            </div>

            {/* keep your drop feel */}
            <style jsx>{`
        .heart-drop {
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

export default ProductCardMobile;
