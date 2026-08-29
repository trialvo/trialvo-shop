"use client";

import { FlaskConical, ShieldCheck, ShoppingCart } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ShopUsdHint } from "@/components/pricing/ShopUsdHint";
import { Surface } from "@/components/section";
import { Button } from "@/components/ui/button";
import { quoteProductPrice, shopDisplayPrice } from "@/lib/productPricing";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailBuyCardProps = {
  product: Product;
  language: MarketplaceLanguage;
  currencyLabel: string;
  buyLabel: string;
  canRequestTrial: boolean;
  onStartTrial: () => void;
};

const COPY = {
  bn: {
    license: "এককালীন পেমেন্ট • আজীবন লাইসেন্স",
    trial: "ফ্রি ট্রায়াল শুরু করুন",
    trialHint: "পেমেন্ট বা কার্ড লাগবে না",
    guarantee: "সোর্স কোড, আজীবন আপডেট ও সাপোর্ট অন্তর্ভুক্ত",
    save: "সেভ",
  },
  en: {
    license: "One-time payment • Lifetime license",
    trial: "Start free trial",
    trialHint: "No payment or card required",
    guarantee: "Source code, lifetime updates and support included",
    save: "Save",
  },
} as const;

/** Price and primary actions. Pinned on desktop by the page layout. */
export function ProductDetailBuyCard({
  product,
  language,
  currencyLabel,
  buyLabel,
  canRequestTrial,
  onStartTrial,
}: Readonly<ProductDetailBuyCardProps>) {
  const quote = quoteProductPrice(product);
  const display = shopDisplayPrice(quote, language, currencyLabel);
  const copy = COPY[language];

  return (
    <Surface
      sheen
      className="p-6 md:p-7"
      itemProp="offers"
      itemScope
      itemType="https://schema.org/Offer"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {copy.license}
      </p>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className="font-display text-[2.5rem] font-bold leading-none tracking-tight text-foreground"
          itemProp="price"
          content={String(display.saleRaw)}
        >
          {display.sale}
        </span>
        {quote.hasDiscount ? (
          <span className="text-lg text-muted-foreground line-through">
            {display.list}
          </span>
        ) : null}
        <ShopUsdHint display={display} className="text-sm text-muted-foreground" />
      </div>

      {quote.hasDiscount ? (
        <p className="mt-2 text-sm font-semibold text-destructive">
          {copy.save} {quote.discountPercent}%
        </p>
      ) : null}

      <meta itemProp="priceCurrency" content="BDT" />
      <link itemProp="availability" href="https://schema.org/InStock" />

      <div className="mt-6 flex flex-col gap-2.5">
        <Button
          asChild
          size="lg"
          className="h-12 rounded-lg bg-accent font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
        >
          <LocalizedLink href={`/checkout?product=${product.slug}`}>
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
            {buyLabel}
          </LocalizedLink>
        </Button>

        {canRequestTrial ? (
          <div>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-lg bg-background font-semibold shadow-card hover:bg-muted/60"
              onClick={onStartTrial}
            >
              <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
              {copy.trial}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {copy.trialHint}
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden="true" />
        {copy.guarantee}
      </p>
    </Surface>
  );
}

export default ProductDetailBuyCard;
