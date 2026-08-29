import type { shopDisplayPrice } from "@/lib/productPricing";

type ShopDisplay = ReturnType<typeof shopDisplayPrice>;

/** Optional USD under the main BDT price — keep it much smaller. */
export function ShopUsdHint({
  display,
  className = "text-[11px] font-normal text-muted-foreground",
}: Readonly<{
  display: ShopDisplay | null | undefined;
  className?: string;
}>) {
  if (!display?.hasUsd || !display.usdSale) return null;
  return <span className={className}>{display.usdSale}</span>;
}

export default ShopUsdHint;
