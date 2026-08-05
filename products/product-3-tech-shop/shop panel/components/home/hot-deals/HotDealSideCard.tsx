"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import {
  hotDealToCartProduct,
  type HotDealItem,
} from "@/lib/adapters/megaSale";

type HotDealSideCardProps = {
  deal: HotDealItem;
  index?: number;
};

function formatMoney(value: number): string {
  return `৳${value.toLocaleString()}`;
}

export function HotDealSideCard({ deal, index = 0 }: HotDealSideCardProps) {
  const { addToCart, isInCart, setIsCartOpen } = useCart();
  const cartProduct = hotDealToCartProduct(deal);
  const lineInCart = deal.skuId
    ? isInCart(cartProduct, deal.skuId)
    : isInCart(cartProduct);

  const handleAddToCart = () => {
    if (lineInCart) {
      setIsCartOpen(true);
      toast.message("Already in cart", {
        description: "Remove it from the cart before adding again.",
      });
      return;
    }
    if (!deal.inStock) {
      toast.error("This deal is out of stock");
      return;
    }
    if (!deal.skuId) {
      toast.error("Please open the product to choose an option");
      return;
    }
    const added = addToCart(
      cartProduct,
      1,
      deal.colorName ?? undefined,
      deal.skuId,
    );
    if (added) toast.success("Added to cart");
  };

  return (
    <article
      className="hot-deal-ticket group relative rounded-r-sm border border-primary-foreground/10 border-l-0 p-3 flex gap-3 hover:border-accent/40 hover:bg-primary-foreground/[0.08] transition-all duration-300"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        href={`/product/${deal.slug}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-sm overflow-hidden shrink-0 border border-primary-foreground/10 bg-secondary/20"
      >
        <img
          src={deal.image}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {deal.discountPercent > 0 ? (
          <span className="absolute top-1 left-1 gradient-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
            -{deal.discountPercent}%
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <p className="text-accent text-[9px] font-bold uppercase tracking-[0.18em] mb-1">
            Ticket #{String(index + 1).padStart(2, "0")}
          </p>
          <Link href={`/product/${deal.slug}`}>
            <h4 className="text-primary-foreground text-sm font-semibold line-clamp-2 hover:text-accent transition-colors leading-snug">
              {deal.title}
            </h4>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-base font-bold text-accent font-heading truncate">
              {formatMoney(deal.price)}
            </span>
            {deal.originalPrice ? (
              <span className="text-[10px] text-primary-foreground/35 line-through shrink-0">
                {formatMoney(deal.originalPrice)}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!deal.inStock}
            className={`shrink-0 h-8 w-8 rounded-sm flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity ${
              lineInCart
                ? "bg-accent/20 text-accent border border-accent/40"
                : "gradient-accent text-accent-foreground"
            }`}
            aria-label={
              lineInCart
                ? `${deal.title} is in cart — add more`
                : `Add ${deal.title} to cart`
            }
            title={lineInCart ? "Already in cart" : "Add to cart"}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
