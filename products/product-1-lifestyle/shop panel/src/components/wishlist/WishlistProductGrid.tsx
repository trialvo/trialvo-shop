"use client";

import type { WishlistProduct } from "@/lib/wishlist/normalizers";
import { ShoppingBag } from "lucide-react";
import { WishlistCard } from "./WishlistCard";

interface WishlistProductGridProps {
  products: WishlistProduct[];
  cartProductIds?: Set<number>;
  onRemove: (productId: number) => void;
  onAddToCart: (product: WishlistProduct) => void;
  onQuickView: (product: WishlistProduct) => void;
  onAddAllToCart: () => void;
}

export function WishlistProductGrid({
  products,
  cartProductIds,
  onRemove,
  onAddToCart,
  onQuickView,
  onAddAllToCart,
}: WishlistProductGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
        {products.map((product) => (
          <WishlistCard
            key={product.id}
            product={product}
            isInCart={cartProductIds?.has(product.id)}
            onRemove={() => onRemove(product.id)}
            onAddToCart={() => onAddToCart(product)}
            onQuickView={() => onQuickView(product)}
          />
        ))}
      </div>

      {/* ── Move all to cart CTA ── */}
      <div className="mt-10 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground tracking-wide">
          Ready to checkout? Add everything at once.
        </p>
        <button
          type="button"
          onClick={onAddAllToCart}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground text-[12px] font-semibold tracking-wide transition-all shadow-sm hover:shadow-md hover:shadow-accent/20 cursor-pointer active:scale-[0.98]"
        >
          <ShoppingBag size={14} /> Add All to Cart
        </button>
      </div>
    </>
  );
}
