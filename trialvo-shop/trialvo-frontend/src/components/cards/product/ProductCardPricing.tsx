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
    <div className="border-t border-border/60 pt-4">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {priceHint}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {quote.hasDiscount ? (
          <>
            <span className="text-sm text-muted-foreground line-through">
              {display.list}
            </span>
            <span
              className="text-[1.45rem] font-semibold tracking-tight text-foreground"
              itemProp="price"
              content={String(display.saleRaw)}
            >
              {display.sale}
            </span>
          </>
        ) : (
          <span
            className="text-[1.45rem] font-semibold tracking-tight text-foreground"
            itemProp="price"
            content={String(display.saleRaw)}
          >
            {display.sale}
          </span>
        )}
      </div>
      <ShopUsdHint display={display} className="mt-0.5 block text-[11px] leading-none text-muted-foreground" />
      <meta itemProp="priceCurrency" content="BDT" />
    </div>
  );
}

export default ProductCardPricing;
