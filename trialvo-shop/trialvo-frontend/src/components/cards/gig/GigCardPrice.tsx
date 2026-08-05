import { formatPriceBdt } from "@/lib/digitalGoods";
import type { GigCardPriceProps } from "@/types/gigCard";

/** Compact price footer — “From” left-muted, amount right-bold */
export function GigCardPrice({
  amount,
  currencyLabel,
  language,
  fromLabel,
}: Readonly<GigCardPriceProps>) {
  return (
    <div
      className="flex items-baseline justify-end gap-1"
      itemProp="offers"
      itemScope
      itemType="https://schema.org/Offer"
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {fromLabel}
      </span>
      <span
        className="text-sm font-bold leading-none text-foreground"
        itemProp="price"
        content={String(amount)}
      >
        {formatPriceBdt(amount, language, currencyLabel)}
      </span>
      <meta itemProp="priceCurrency" content="BDT" />
    </div>
  );
}

export default GigCardPrice;
