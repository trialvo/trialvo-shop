"use client";

import { useState, type ReactElement } from "react";
import { Heart, ShoppingCart, Star, Eye, Truck } from "lucide-react";
import Link from "next/link";
import { Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/context/WishlistContext";
import { AddToCompareButton } from "@/components/compare/AddToCompareButton";
import { ProductQuickViewDialog } from "@/components/product/ProductQuickViewDialog";
import { productToCompareSlot } from "@/lib/adapters/compareSlot";
import { addToCartLabel } from "@/lib/cart/addToCartLabel";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  new: "bg-success text-success-foreground",
  bestseller: "bg-primary text-primary-foreground",
  hot: "bg-destructive text-destructive-foreground",
  sale: "bg-accent text-accent-foreground",
};

const ProductCard = ({ product }: { product: Product }): ReactElement => {
  const { addToCart, isInCart, getQuantityInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);
  const inCart = isInCart(product);
  const qtyInCart = getQuantityInCart(product);
  const cartButtonLabel = addToCartLabel({
    inCart,
    quantityInCart: qtyInCart,
  });
  const compareSlot = productToCompareSlot(product);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = () => {
    if (inCart) return;
    addToCart(product);
  };

  return (
    <>
      <div className="group bg-card rounded-sm border border-border overflow-hidden shadow-product hover:shadow-product-hover transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <Link href={`/product/${product.slug}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </Link>

          <div className="absolute top-2 left-2 z-[1] flex max-w-[calc(100%-3.5rem)] flex-col items-start gap-1">
            {product.badge ? (
              <span
                className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide ${badgeStyles[product.badge]}`}
              >
                {product.badge === "sale" && product.discount
                  ? `-${product.discount}%`
                  : product.badge}
              </span>
            ) : null}
            {product.freeDelivery ? (
              <span
                className="inline-flex items-center gap-1 rounded-sm border border-success/30 bg-success px-1.5 py-0.5 text-[10px] font-bold text-success-foreground shadow-sm"
                title="This product ships with free delivery"
              >
                <Truck className="h-3 w-3 shrink-0" aria-hidden />
                Free delivery
              </span>
            ) : null}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                void toggleWishlist(product.id);
              }}
              className={`h-7 w-7 rounded-sm flex items-center justify-center transition-all ${
                wishlisted
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-card/80 backdrop-blur-sm text-foreground hover:bg-card"
              }`}
              aria-label={
                wishlisted ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              <Heart
                className="h-3.5 w-3.5"
                fill={wishlisted ? "currentColor" : "none"}
              />
            </button>
            {compareSlot ? (
              <AddToCompareButton product={compareSlot} variant="icon" />
            ) : null}
            {/* Mobile: always-visible Quick View (hover overlay is desktop-only) */}
            <button
              type="button"
              aria-label={`Quick view ${product.title}`}
              onClick={() => setQuickViewOpen(true)}
              className="sm:hidden h-7 w-7 rounded-sm bg-card/80 backdrop-blur-sm flex items-center justify-center text-foreground cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 max-sm:hidden">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={inCart}
                aria-disabled={inCart}
                aria-label={cartButtonLabel}
                title={
                  inCart
                    ? "Already in cart — remove it from the cart to add again"
                    : "Add to cart"
                }
                className={cn(
                  "flex-1 py-2 rounded-sm text-xs font-medium flex items-center justify-center gap-1 transition-opacity",
                  inCart
                    ? "cursor-not-allowed border border-border bg-muted text-muted-foreground opacity-80"
                    : "cursor-pointer gradient-primary text-primary-foreground hover:opacity-90",
                )}
              >
                <ShoppingCart className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{cartButtonLabel}</span>
              </button>
              <button
                type="button"
                aria-label={`Quick view ${product.title}`}
                onClick={() => setQuickViewOpen(true)}
                className="h-8 w-8 rounded-sm bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
            {product.brand}
          </p>
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="text-[11px] font-medium">{product.rating}</span>
            <span className="text-[11px] text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-primary font-heading">
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice ? (
              <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <ProductQuickViewDialog
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        product={product}
      />
    </>
  );
};

export default ProductCard;
