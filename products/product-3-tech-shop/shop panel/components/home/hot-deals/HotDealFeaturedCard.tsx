"use client";

import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import { useCart } from "@/hooks/useCart";
import { addToCartLabel } from "@/lib/cart/addToCartLabel";
import {
  hotDealToCartProduct,
  type HotDealItem,
} from "@/lib/adapters/megaSale";

type HotDealFeaturedCardProps = {
  deal: HotDealItem;
};

function formatMoney(value: number): string {
  return `৳${value.toLocaleString()}`;
}

export function HotDealFeaturedCard({ deal }: HotDealFeaturedCardProps) {
  const { addToCart, isInCart, getQuantityInCart, setIsCartOpen } = useCart();
  const cartProduct = hotDealToCartProduct(deal);
  const lineInCart = deal.skuId
    ? isInCart(cartProduct, deal.skuId)
    : isInCart(cartProduct);
  const qtyInCart = deal.skuId
    ? getQuantityInCart(cartProduct, deal.skuId)
    : getQuantityInCart(cartProduct);
  const grabLabel = lineInCart
    ? addToCartLabel({ inCart: true, quantityInCart: qtyInCart })
    : "Grab Deal";

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

  const urgency =
    deal.stock <= 0
      ? "Sold out"
      : deal.stock <= 5
        ? `Only ${deal.stock} left`
        : `${deal.stock} in stock`;

  return (
    <article className="group relative h-full min-h-[420px] md:min-h-[520px] rounded-sm overflow-hidden border border-primary-foreground/10">
      <img
        src={deal.image}
        alt={deal.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-transparent to-transparent" />

      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <span className="gradient-accent text-accent-foreground px-2.5 py-1 rounded-sm text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          {deal.discountPercent > 0 ? `${deal.discountPercent}% OFF` : "Hot Deal"}
        </span>
        <span className="bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-primary-foreground/20">
          Spotlight
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-7">
        <p className="text-accent text-[11px] font-bold uppercase tracking-[0.2em] mb-2">
          Deal of the day · {urgency}
        </p>
        <Link href={`/product/${deal.slug}`}>
          <h3 className="font-heading text-2xl md:text-4xl font-bold text-primary-foreground leading-tight line-clamp-2 mb-4 hover:text-accent transition-colors max-w-xl">
            {deal.title}
          </h3>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-5xl font-extrabold text-accent font-heading">
              {formatMoney(deal.price)}
            </span>
            {deal.originalPrice ? (
              <span className="text-base md:text-lg text-primary-foreground/40 line-through">
                {formatMoney(deal.originalPrice)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:justify-end">
            <AppButton
              size="lg"
              variant={lineInCart ? "onDark" : "accent"}
              className="font-semibold rounded-sm"
              onClick={handleAddToCart}
              disabled={!deal.inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> {grabLabel}
            </AppButton>
            <AppButton
              asChild
              variant="onDark"
              size="lg"
              className="rounded-sm"
            >
              <Link href={`/product/${deal.slug}`}>
                Details <RightArrowIcon className="h-4 w-4 ml-1.5" />
              </Link>
            </AppButton>
          </div>
        </div>
      </div>
    </article>
  );
}
