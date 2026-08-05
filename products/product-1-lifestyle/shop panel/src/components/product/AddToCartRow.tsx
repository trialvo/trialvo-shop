"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  FlatHeartIcon,
  FlatHeartOutlineIcon,
  FlatBagIcon,
  FlatCheckIcon,
  FlatBoltIcon,
  FlatSpinnerIcon,
  FlatMinusIcon,
  FlatPlusIcon,
} from "@/components/ui/FlatIcons";

interface AddToCartRowProps {
  quantity: number;
  onQuantityChange: (q: number) => void;
  onAddToCart: () => void;
  onShopNow: () => void;          // validate + add + redirect to checkout
  onToggleWishlist: () => void;
  inWishlist: boolean;
  className?: string;
}

export function AddToCartRow({
  quantity, onQuantityChange, onAddToCart, onShopNow,
  onToggleWishlist, inWishlist, className,
}: AddToCartRowProps) {
  const [added,     setAdded]     = useState(false);
  const [shopping,  setShopping]  = useState(false);

  const handleAdd = () => {
    onAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShopNow = async () => {
    setShopping(true);
    onShopNow();             // parent handles validation + addItem + router.push
    // Keep spinner briefly — navigation clears it
    setTimeout(() => setShopping(false), 3000);
  };

  return (
    <div className={cn("space-y-4", className)}>

      {/* Quantity */}
      <div>
        <p className="text-sm text-foreground font-medium mb-2">
          Quantity: <span className="font-semibold">{String(quantity).padStart(2, "0")}</span>
        </p>
        <div className="inline-flex items-center border border-border rounded-lg h-10 w-[130px]">
          <button type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="w-9 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer select-none">
            <FlatMinusIcon size={12} />
          </button>
          <span className="flex-1 text-center text-sm font-semibold text-foreground select-none border-x border-border h-full flex items-center justify-center">
            {String(quantity).padStart(2, "0")}
          </span>
          <button type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-9 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer select-none">
            <FlatPlusIcon size={12} />
          </button>
        </div>
      </div>

      {/* CTA row: ♡ | Add To Cart | Shop Now */}
      <div className="flex gap-2 items-stretch">

        {/* Wishlist */}
        <button type="button" onClick={onToggleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "w-10 h-10 border rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0",
            inWishlist
              ? "bg-secondary border-foreground/30 text-sale"
              : "border-border text-muted-foreground hover:text-sale hover:border-foreground/30"
          )}>
          {inWishlist
            ? <FlatHeartIcon size={16} className="fill-sale" />
            : <FlatHeartOutlineIcon size={16} />}
        </button>

        {/* Add To Cart */}
        <button type="button" onClick={handleAdd}
          className={cn(
            "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer active:scale-[0.98]",
            added
              ? "bg-success text-success-foreground"
              : "bg-accent text-accent-foreground hover:bg-accent/85"
          )}>
          {added
            ? <><FlatCheckIcon size={14} /> Added!</>
            : <><FlatBagIcon size={14} /> Add To Cart</>}
        </button>

        {/* Shop Now */}
        <button type="button" onClick={handleShopNow} disabled={shopping}
          className={cn(
            "flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-[13px] font-semibold tracking-wide border border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-200 cursor-pointer active:scale-[0.98]",
            shopping && "opacity-70 cursor-not-allowed"
          )}>
          {shopping
            ? <><FlatSpinnerIcon size={13} /> Redirecting…</>
            : <><FlatBoltIcon size={13} /> Shop Now</>}
        </button>
      </div>
    </div>
  );
}
