/**
 * Must stay in lockstep with trialvo-backend/src/lib/productPricing.js
 */

import { formatPriceBdt, formatPriceUsd } from "@/lib/digitalGoods";
import type { MarketplaceLanguage } from "@/types/marketplace";

export function roundMoney(value: number | string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function clampDiscountPercent(raw: number | string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return Math.round(n * 100) / 100;
}

export function saleAmount(
  listPrice: number | string | null | undefined,
  discountPercent: number | string | null | undefined,
): number {
  const list = roundMoney(listPrice);
  const pct = clampDiscountPercent(discountPercent);
  if (pct <= 0) return list;
  if (pct >= 100) return 0;
  return roundMoney((list * (100 - pct)) / 100);
}

export type ProductPriceQuote = {
  listBdt: number;
  listUsd: number;
  discountPercent: number;
  saleBdt: number;
  saleUsd: number;
  discountBdt: number;
  discountUsd: number;
  hasDiscount: boolean;
};

export function quoteProductPrice(product: {
  priceBDT?: number;
  priceUSD?: number;
  discountPercent?: number | null;
}): ProductPriceQuote {
  const listBdt = roundMoney(product.priceBDT);
  const listUsd = roundMoney(product.priceUSD);
  const percent = clampDiscountPercent(product.discountPercent);
  const saleBdt = saleAmount(listBdt, percent);
  const saleUsd = saleAmount(listUsd, percent);
  return {
    listBdt,
    listUsd,
    discountPercent: percent,
    saleBdt,
    saleUsd,
    discountBdt: roundMoney(listBdt - saleBdt),
    discountUsd: roundMoney(listUsd - saleUsd),
    hasDiscount: percent > 0,
  };
}

/** Shop UI: BDT is always the main price. USD is an optional secondary line. */
export function shopDisplayPrice(
  quote: ProductPriceQuote,
  language: MarketplaceLanguage,
  bdtLabel = "৳",
) {
  const hasUsd = quote.listUsd > 0;
  return {
    currency: "BDT" as const,
    list: formatPriceBdt(quote.listBdt, language, bdtLabel),
    sale: formatPriceBdt(quote.saleBdt, language, bdtLabel),
    listRaw: quote.listBdt,
    saleRaw: quote.saleBdt,
    hasUsd,
    usdList: hasUsd ? formatPriceUsd(quote.listUsd, language) : "",
    usdSale: hasUsd ? formatPriceUsd(quote.saleUsd, language) : "",
  };
}

export function shopDiscountLabel(
  quote: ProductPriceQuote,
  language: MarketplaceLanguage,
  bdtLabel = "৳",
) {
  const display = shopDisplayPrice(
    {
      ...quote,
      saleBdt: quote.discountBdt,
      saleUsd: quote.discountUsd,
    },
    language,
    bdtLabel,
  );
  return display.sale;
}
