"use client";

import SafeImage from "@/components/ui/SafeImage";
import { BADGE_STYLES, ICON_BUTTON_CLASSES, CARD_ACTION_BUTTON_CLASSES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { Check, Eye, Heart, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";



export type NewArrivalProduct = Product & {
  productVariationId?: number;
  stock: number;
  originalPrice: number;
};

interface NewArrivalProductCardProps {
  product: NewArrivalProduct;
  isWishlisted: boolean;
  isInCart?: boolean;
  onToggleWishlist: (product: NewArrivalProduct) => void;
  onAddToCart: (product: NewArrivalProduct) => void;
  onQuickView: (product: NewArrivalProduct) => void;
}

export function NewArrivalProductCard({
  product: p,
  isWishlisted,
  isInCart = false,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
}: NewArrivalProductCardProps) {
  const rating = Number.isFinite(p.rating)
    ? Math.max(0, Math.min(5, p.rating))
    : 0;
  const filledStars = Math.round(rating);

  return (
    <div className="group relative flex flex-col">
      {/* Image card */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-secondary aspect-3/4 shadow-sm">
        <Link href={`/product/${p.slug}`}>
          <SafeImage
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badge */}
        {p.badge && (
          <span className={`absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-[9px] tracking-[0.12em] uppercase font-bold px-2 py-0.5 rounded-full ${BADGE_STYLES[p.badge.toUpperCase()] ?? "bg-accent text-accent-foreground"}`}>
            {p.badge}
          </span>
        )}

        {/* Discount pill */}
        {p.oldPrice && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-background/90 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold text-sale px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
            -{Math.round((1 - p.price / p.oldPrice) * 100)}%
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 flex gap-1.5 sm:gap-2 justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(p);
            }}
            className={cn(ICON_BUTTON_CLASSES, "w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/90 backdrop-blur-sm hover:bg-sale/10 hover:text-sale")}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
          >
            <Heart
              size={13}
              className={isWishlisted ? "fill-sale text-sale" : "text-sale"}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(p);
            }}
            className={cn(
              CARD_ACTION_BUTTON_CLASSES,
              "flex-1 h-8 sm:h-9 rounded-full gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] tracking-wide",
              isInCart
                ? "bg-success hover:bg-success/90 text-success-foreground"
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            )}
            aria-label={isInCart ? "Already in cart" : "Add to cart"}
          >
            {isInCart
              ? <><Check size={12} /> <span className="hidden sm:inline">In</span> Cart</>
              : <><ShoppingBag size={12} /> <span className="hidden sm:inline">Add to</span> Cart</>}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuickView(p);
            }}
            className={cn(ICON_BUTTON_CLASSES, "w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/90 backdrop-blur-sm hover:bg-secondary")}
            aria-label="Quick view"
          >
            <Eye size={13} />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="mt-2.5 sm:mt-3 px-0.5 flex-1 flex flex-col">
        <Link href={`/product/${p.slug}`}>
          <h3 className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate group-hover:text-accent transition-colors leading-snug">
            {p.name}
          </h3>
        </Link>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 tracking-wide">{p.category}</p>
        {/* Stars */}
        <div className="flex items-center gap-0.5 sm:gap-1 mt-1 sm:mt-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={9}
              className={star <= filledStars ? "text-warning fill-warning" : "text-border fill-border"}
            />
          ))}
          <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-0.5">({rating.toFixed(1)})</span>
        </div>
        {/* Price */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
          <span className="text-[14px] sm:text-[15px] font-bold text-foreground">৳{p.price}</span>
          {p.oldPrice && (
            <span className="text-[10px] sm:text-xs text-muted-foreground line-through">৳{p.oldPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}
