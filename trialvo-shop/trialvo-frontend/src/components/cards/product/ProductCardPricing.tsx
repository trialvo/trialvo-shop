import { ArrowRight, Lock } from "lucide-react";
import { formatPriceBdt, formatPriceUsd } from "@/lib/digitalGoods";
import { quoteProductPrice } from "@/lib/productPricing";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ProductCardPricingProps = {
  amountBdt: number;
  amountUsd: number;
  discountPercent?: number;
  currencyLabel: string;
  language: MarketplaceLanguage;
  priceHint: string;
  ctaLabel: string;
  trustLabel: string;
};

/** Price + CTA from API amounts (BDT primary, USD when present) */
export function ProductCardPricing({
  amountBdt,
  amountUsd,
  discountPercent = 0,
  currencyLabel,
  language,
  priceHint,
  ctaLabel,
  trustLabel,
}: Readonly<ProductCardPricingProps>) {
  const quote = quoteProductPrice({
    priceBDT: amountBdt,
    priceUSD: amountUsd,
    discountPercent,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {quote.hasDiscount ? (
              <>
                <span className="text-lg font-semibold tracking-tight text-muted-foreground line-through decoration-destructive decoration-2">
                  {formatPriceBdt(quote.listBdt, language, currencyLabel)}
                </span>
                <span
                  className="text-2xl font-bold tracking-tight text-accent"
                  itemProp="price"
                  content={String(quote.saleBdt)}
                >
                  {formatPriceBdt(quote.saleBdt, language, currencyLabel)}
                </span>
                <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                  -{quote.discountPercent}%
                </span>
              </>
            ) : (
              <span
                className="text-2xl font-bold tracking-tight text-accent"
                itemProp="price"
                content={String(quote.saleBdt)}
              >
                {formatPriceBdt(quote.saleBdt, language, currencyLabel)}
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {priceHint}
            </span>
          </div>
          {quote.listUsd > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {quote.hasDiscount ? (
                <>
                  <span className="line-through decoration-destructive/80 mr-1.5">
                    {formatPriceUsd(quote.listUsd, language)} USD
                  </span>
                  <span>{formatPriceUsd(quote.saleUsd, language)} USD</span>
                </>
              ) : (
                <>{formatPriceUsd(quote.saleUsd, language)} USD</>
              )}
            </p>
          ) : null}
          <meta itemProp="priceCurrency" content="BDT" />
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-colors group-hover:bg-accent/90">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
        {trustLabel}
      </p>
    </div>
  );
}

export default ProductCardPricing;

