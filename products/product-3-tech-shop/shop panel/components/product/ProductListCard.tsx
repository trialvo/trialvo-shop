"use client";

import { Heart, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/context/WishlistContext";
import { AppButton } from "@/components/shared/AppButton";
import { addToCartLabel } from "@/lib/cart/addToCartLabel";

const badgeStyles: Record<string, string> = {
  new: "bg-success text-success-foreground",
  bestseller: "bg-primary text-primary-foreground",
  hot: "bg-destructive text-destructive-foreground",
  sale: "bg-accent text-accent-foreground",
};

const ProductListCard = ({ product }: { product: Product }) => {
  const { addToCart, isInCart, getQuantityInCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);
  const inCart = isInCart(product);
  const qtyInCart = getQuantityInCart(product);
  const cartButtonLabel = addToCartLabel({
    inCart,
    quantityInCart: qtyInCart,
    compact: true,
  });

  const handleAddToCart = () => {
    if (inCart) return;
    addToCart(product);
  };

  return (
    <div className="group flex gap-3 md:gap-4 bg-card rounded-sm border border-border overflow-hidden shadow-product hover:shadow-product-hover transition-all duration-300 p-3">
      <div className="relative w-28 md:w-44 shrink-0 aspect-square rounded-sm overflow-hidden bg-secondary/30">
        <Link href={`/product/${product.slug}`}>
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        {product.badge ? (
          <span
            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wide ${badgeStyles[product.badge]}`}
          >
            {product.badge === "sale" && product.discount
              ? `-${product.discount}%`
              : product.badge}
          </span>
        ) : null}
      </div>
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {product.brand}
          </p>
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-xs md:text-sm font-medium hover:text-primary transition-colors leading-snug mt-0.5 line-clamp-2">
              {product.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="text-[11px] font-medium">{product.rating}</span>
            <span className="text-[11px] text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
          {product.highlights ? (
            <ul className="hidden md:block mt-1.5 space-y-0.5">
              {product.highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="text-[11px] text-muted-foreground">
                  • {h}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm md:text-base font-bold text-primary font-heading">
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice ? (
              <span className="text-[11px] text-muted-foreground line-through">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                void toggleWishlist(product.id);
              }}
              className={`h-7 w-7 rounded-sm flex items-center justify-center border transition-all ${
                wishlisted
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "border-border hover:border-primary text-muted-foreground hover:text-primary"
              }`}
            >
              <Heart
                className="h-3 w-3"
                fill={wishlisted ? "currentColor" : "none"}
              />
            </button>
            <AppButton
              size="sm"
              variant={inCart ? "outline" : "primary"}
              onClick={handleAddToCart}
              disabled={inCart}
              className="text-[11px] h-7 px-2 rounded-sm disabled:pointer-events-none disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-80"
              aria-label={cartButtonLabel}
              title={
                inCart
                  ? "Already in cart — remove it from the cart to add again"
                  : "Add to cart"
              }
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {cartButtonLabel}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListCard;
