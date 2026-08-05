"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { HeartOff, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/context/WishlistContext";
import type { WishlistItemViewModel } from "@/lib/adapters/accountWishlist";
import { addToCartLabel } from "@/lib/cart/addToCartLabel";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type WishlistItemCardProps = Readonly<{
  item: WishlistItemViewModel;
}>;

/**
 * Wishlist product card — always-visible Remove + Add to cart (mobile-friendly).
 */
export function WishlistItemCard({ item }: WishlistItemCardProps): ReactElement {
  const { addToCart, isInCart, getQuantityInCart, setIsCartOpen } = useCart();
  const { toggleWishlist } = useWishlist();
  const [removing, setRemoving] = useState(false);
  const inCart = isInCart(item.product);
  const qtyInCart = getQuantityInCart(item.product);
  const cartLabel = addToCartLabel({
    inCart,
    quantityInCart: qtyInCart,
    compact: true,
  });

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await toggleWishlist(item.id);
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(err, "Could not update wishlist."),
      );
    } finally {
      setRemoving(false);
    }
  };

  const handleAddToCart = () => {
    if (inCart) {
      setIsCartOpen(true);
      toast.message("Already in cart", {
        description: "Remove it from the cart before adding again.",
      });
      return;
    }
    if (!item.inStock) {
      toast.error("This product is out of stock.");
      return;
    }
    const added = addToCart(item.product);
    if (added) toast.success("Added to cart");
  };

  return (
    <article className="group bg-card rounded-sm border border-border overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-secondary/30">
        <Link href={`/product/${item.slug}`} className="block h-full w-full">
          {/* Keep native img for remote product media with unknown domains */}
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {item.discountLabel ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase bg-accent text-accent-foreground">
            {item.discountLabel}
          </span>
        ) : null}

        {!item.inStock ? (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-sm text-[10px] font-medium bg-background/90 border border-border">
            Out of stock
          </span>
        ) : null}
      </div>

      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="min-w-0 space-y-1 flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
            {item.brand}
          </p>
          <Link href={`/product/${item.slug}`}>
            <h3 className="text-xs sm:text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-snug">
              {item.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" aria-hidden />
            <span className="text-[11px] text-muted-foreground">
              {item.ratingLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-primary font-heading">
              {item.priceLabel}
            </span>
            {item.originalPriceLabel ? (
              <span className="text-[11px] text-muted-foreground line-through">
                {item.originalPriceLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-1.5 pt-0.5">
          <AppButton
            type="button"
            size="sm"
            variant={inCart ? "outline" : "primary"}
            className={cn("flex-1 text-xs h-8 gap-1 rounded-sm")}
            disabled={!item.inStock || removing}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3 w-3" aria-hidden />
            {cartLabel}
          </AppButton>
          <AppButton
            type="button"
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 shrink-0"
            disabled={removing}
            isLoading={removing}
            aria-label={`Remove ${item.title} from wishlist`}
            onClick={() => void handleRemove()}
          >
            {!removing ? (
              <HeartOff className="h-3.5 w-3.5" aria-hidden />
            ) : null}
          </AppButton>
        </div>
      </div>
    </article>
  );
}
