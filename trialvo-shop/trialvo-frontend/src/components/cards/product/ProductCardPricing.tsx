import { ShopUsdHint } from "@/components/pricing/ShopUsdHint";
import { quoteProductPrice, shopDisplayPrice } from "@/lib/productPricing";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ProductCardPricingProps = {
  amountBdt: number;
  amountUsd: number;
  discountPercent?: number;
  currencyLabel: string;
  language: MarketplaceLanguage;
  priceHint: string;
};

/** BDT is the main price. USD, if set, stays a small secondary line. */
export function ProductCardPricing({
  amountBdt,
  amountUsd,
  discountPercent = 0,
  currencyLabel,
  language,
  priceHint,
}: Readonly<ProductCardPricingProps>) {
  const quote = quoteProductPrice({
    priceBDT: amountBdt,
    priceUSD: amountUsd,
    discountPercent,
  });
  const display = shopDisplayPrice(quote, language, currencyLabel);

  return (
    <div className="flex items-baseline justify-between gap-3 whitespace-nowrap border-t border-border/60 pt-4">
      <p className="min-w-0 truncate text-[11px] font-medium text-muted-foreground">
        {priceHint}
      </p>
      <div className="flex shrink-0 items-baseline gap-2">
        {quote.hasDiscount ? (
          <span className="text-sm text-muted-foreground line-through">
            {display.list}
          </span>
        ) : null}
        <span
          className="text-xl font-semibold tracking-tight text-foreground"
          itemProp="price"
          content={String(display.saleRaw)}
        >
          {display.sale}
        </span>
        <ShopUsdHint
          display={display}
          className="text-[11px] leading-none text-muted-foreground"
        />
      </div>
      <meta itemProp="priceCurrency" content="BDT" />
    </div>
  );
}

export default ProductCardPricing;
