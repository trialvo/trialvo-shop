"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Eye, Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import { BADGE_STYLES, ICON_BUTTON_CLASSES, CARD_ACTION_BUTTON_CLASSES } from "@/lib/theme";
import type { Product } from "@/types";

export interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  isInCart?: boolean;
  onToggleWishlist: () => void;
  onQuickView: () => void;
  onAddToCart: () => void;
}



export function ProductCard({
  product,
  isWishlisted,
  isInCart = false,
  onToggleWishlist,
  onQuickView,
  onAddToCart,
}: ProductCardProps) {
  const discountPct = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  const badgeKey = product.badge?.toUpperCase() ?? "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="group flex flex-col"
    >
      {/* ── Image card ── */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary mb-3 shadow-sm">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <SafeImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badge */}
        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 text-[9px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm",
              BADGE_STYLES[badgeKey] ?? "bg-accent text-accent-foreground"
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Discount % pill */}
        {discountPct && (
          <span className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-[10px] font-bold text-sale px-2 py-0.5 rounded-full shadow-sm">
            -{discountPct}%
          </span>
        )}

        {/* Wishlist button — always visible */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onToggleWishlist(); }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer active:scale-90",
            discountPct ? "top-10" : "top-3",
            isWishlisted
              ? "bg-sale text-sale-foreground"
              : "bg-background/90 backdrop-blur-sm text-foreground/60 hover:text-sale hover:bg-background"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={14} className={isWishlisted ? "fill-current" : ""} />
        </button>

        {/* Bottom action bar — slides up on hover */}
        <div className="absolute inset-x-2 bottom-2 flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onQuickView(); }}
            className={cn(ICON_BUTTON_CLASSES, "bg-background/90 backdrop-blur-sm text-foreground hover:bg-secondary")}
            aria-label="Quick view"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); if (!isInCart) onAddToCart(); }}
            className={cn(
              CARD_ACTION_BUTTON_CLASSES,
              "flex-1",
              isInCart
                ? "bg-success hover:bg-success/90 text-success-foreground"
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            )}
            aria-label={isInCart ? "Already in cart" : "Add to cart"}
          >
            {isInCart ? <><Check size={13} /> In Cart</> : <><ShoppingBag size={13} /> Add to Cart</>}
          </button>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="flex-1 flex flex-col px-0.5">
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
          {product.category}
        </p>
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[13px] font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={10}
              className={s <= 4 ? "text-warning fill-warning" : "text-border fill-border"}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-0.5">(4.0)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-[15px] font-bold text-foreground">${product.price.toFixed(2)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${product.oldPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
