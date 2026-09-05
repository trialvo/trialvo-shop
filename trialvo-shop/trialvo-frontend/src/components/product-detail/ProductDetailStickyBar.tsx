"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { ShoppingCart } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { quoteProductPrice, shopDisplayPrice } from "@/lib/productPricing";
import { cn } from "@/lib/utils";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailStickyBarProps = {
  product: Product;
  language: MarketplaceLanguage;
  currencyLabel: string;
  buyLabel: string;
  /** Instant demo available — the bar shows a "Demo" button */
  canRequestTrial: boolean;
  onStartTrial: () => void;
  /** The inline buy card. The bar hides while that card is on screen. */
  watch: RefObject<HTMLElement | null>;
};

const COPY = {
  bn: { license: "এককালীন পেমেন্ট", trial: "ডেমো" },
  en: { license: "One-time payment", trial: "Demo" },
} as const;

/**
 * Phone-only action bar. On a small screen the price and buttons sit far above
 * the specs, demo links and FAQ, so this keeps them one thumb-tap away. It
 * stays out of the way whenever the real buy card is already on screen.
 */
export function ProductDetailStickyBar({
  product,
  language,
  currencyLabel,
  buyLabel,
  canRequestTrial,
  onStartTrial,
  watch,
}: Readonly<ProductDetailStickyBarProps>) {
  const [visible, setVisible] = useState(false);

  // The bar is fixed, so the page needs extra room at the end or it would
  // cover the last rows of the footer.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023.9px)");
    const apply = () => {
      document.body.style.paddingBottom = query.matches ? "5rem" : "";
    };

    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      document.body.style.paddingBottom = "";
    };
  }, []);

  useEffect(() => {
    const target = watch.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [watch]);

  const quote = quoteProductPrice(product);
  const display = shopDisplayPrice(quote, language, currencyLabel);
  const copy = COPY[language];

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 lg:hidden",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {copy.license}
          </p>
          <p className="font-display text-xl font-bold leading-tight tracking-tight text-foreground">
            {display.sale}
          </p>
        </div>

        {canRequestTrial ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-lg bg-background px-3 font-semibold"
            onClick={onStartTrial}
            tabIndex={visible ? undefined : -1}
          >
            {copy.trial}
          </Button>
        ) : null}

        <Button
          asChild
          className="h-11 shrink-0 rounded-lg bg-accent px-4 font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
        >
          <LocalizedLink
            href={`/checkout?product=${product.slug}`}
            tabIndex={visible ? undefined : -1}
          >
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            {buyLabel}
          </LocalizedLink>
        </Button>
      </div>
    </div>
  );
}

export default ProductDetailStickyBar;
