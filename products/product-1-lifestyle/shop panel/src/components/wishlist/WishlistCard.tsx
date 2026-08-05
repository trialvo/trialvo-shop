"use client";

import SafeImage from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import { BADGE_STYLES, CARD_CLASSES, CARD_HOVER_CLASSES, ICON_BUTTON_CLASSES, CARD_ACTION_BUTTON_CLASSES } from "@/lib/theme";
import type { WishlistProduct } from "@/lib/wishlist/normalizers";
import { Check, Eye, ShoppingBag, Star, Trash2 } from "lucide-react";
import Link from "next/link";



interface WishlistCardProps {
  product: WishlistProduct;
  isInCart?: boolean;
  onRemove: () => void;
  onAddToCart: () => void;
  onQuickView: () => void;
}

export function WishlistCard({
  product,
  isInCart = false,
  onRemove,
  onAddToCart,
  onQuickView,
}: WishlistCardProps) {
  const discountPct = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;
  const badgeKey = product.badge?.toUpperCase() ?? "";
  const rating = Number.isFinite(product.rating)
    ? Math.max(0, Math.min(5, product.rating))
    : 0;
  const filledStars = Math.round(rating);

  return (
    <div className={cn("group relative flex flex-col", CARD_CLASSES, CARD_HOVER_CLASSES)}>

      {/* ── Image ── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <SafeImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Badge */}
        {product.badge && (
          <span className={cn(
            "absolute top-3 left-3 text-[9px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm",
            BADGE_STYLES[badgeKey] ?? "bg-accent text-accent-foreground"
          )}>
            {product.badge}
          </span>
        )}

        {/* Discount % */}
        {discountPct && (
          <span className={cn(
            "absolute text-[10px] font-bold text-sale bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm",
            product.badge ? "top-10 right-3" : "top-3 right-3"
          )}>
            -{discountPct}%
          </span>
        )}

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer",
            "bg-background/80 backdrop-blur-sm text-foreground/50",
            "hover:bg-sale hover:text-sale-foreground transition-all duration-200 shadow-md active:scale-90",
            discountPct ? "top-10 right-3" : "top-3 right-3",
            product.badge && !discountPct && "top-3 right-3",
            product.badge && discountPct && "top-[4.5rem] right-3",
          )}
          aria-label="Remove from wishlist"
        >
          <Trash2 size={13} />
        </button>

        {/* Actions — slide up on hover */}
        <div className="absolute inset-x-2 bottom-2 flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={onQuickView}
            className={cn(ICON_BUTTON_CLASSES, "bg-background/90 backdrop-blur-sm text-foreground hover:bg-secondary")}
            aria-label="Quick view"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={isInCart ? undefined : onAddToCart}
            className={cn(
              CARD_ACTION_BUTTON_CLASSES,
              "flex-1",
              isInCart
                ? "bg-success hover:bg-success/90 text-success-foreground"
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            )}
          >
            {isInCart ? <><Check size={13} /> In Cart</> : <><ShoppingBag size={13} /> Add to Cart</>}
          </button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="p-3.5 flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground leading-none">
          {product.category}
        </p>
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[13px] font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={9}
              className={s <= filledStars ? "text-warning fill-warning" : "text-border fill-border"}
            />
          ))}
          <span className="text-[9px] text-muted-foreground ml-0.5">({rating.toFixed(1)})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[15px] font-bold text-foreground">${product.price.toFixed(2)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">${product.oldPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
