import React from "react";
import { Plus, Star, Tag, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";
import type { SaleProduct } from "./types";

type Props = {
  product: SaleProduct;
  onClick?: () => void;
};

function formatBdt(n: number) {
  return `৳${Number.isFinite(n) ? n.toLocaleString("en-BD") : "0"}`;
}

function computePriceRange(p: any) {
  const vars = Array.isArray(p?.variations) ? p.variations : [];
  const prices = vars
    .map((v: any) => Number(v?.selling_price))
    .filter((n: number) => Number.isFinite(n));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function hasAnyDiscount(p: any) {
  const vars = Array.isArray(p?.variations) ? p.variations : [];
  return vars.some((v: any) => Number(v?.discount ?? 0) > 0);
}

function getCoverImage(p: any) {
  const img = p?.images?.[0]?.path ?? p?.image ?? null;
  return img ? toPublicUrl(img) : null;
}

/**
 * Friendly product tile for New Sale catalog.
 */
export default function ProductCard({ product, onClick }: Props) {
  const { t } = useTranslation();
  const p: any = product;

  const name = String(p?.name ?? p?.title ?? "Untitled Product");
  const fallback = imageFallbackSvgDataUri(name);
  const cover = getCoverImage(p) ?? fallback;

  const range = computePriceRange(p);
  const discount = hasAnyDiscount(p);

  const stockSummary = p?.stock_summary ?? null;
  const inStock = stockSummary?.in_stock === true;
  const totalStock = Number(stockSummary?.total_stock ?? 0);
  const variationCount = Number(
    stockSummary?.variation_count ?? (p?.variations?.length ?? 0),
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left",
        "shadow-theme-xs transition duration-200",
        "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-theme-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
        "dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-white/[0.03]">
        <img
          src={cover}
          alt={name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          onError={(event) => {
            const target = event.currentTarget;
            if (target.src !== fallback) target.src = fallback;
          }}
        />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {p?.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Star className="h-2.5 w-2.5" /> {t("sales.featured")}
            </span>
          ) : null}
          {discount ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <Tag className="h-2.5 w-2.5" /> {t("sales.saleLabel")}
            </span>
          ) : null}
          {p?.free_delivery ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Truck className="h-2.5 w-2.5" /> {t("sales.free")}
            </span>
          ) : null}
        </div>

        <span
          className={cn(
            "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
            inStock
              ? "bg-success-50/95 text-success-700 dark:bg-success-500/20 dark:text-success-300"
              : "bg-error-50/95 text-error-700 dark:bg-error-500/20 dark:text-error-300",
          )}
        >
          {inStock ? t("sales.inStock") : t("sales.outLabel")}
        </span>

        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-600 opacity-0 shadow-theme-sm transition group-hover:opacity-100 dark:bg-gray-900 dark:text-brand-300">
          <Plus className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
            {name}
          </p>
          <p className="mt-1 text-xs text-gray-400">#{String(p?.id)}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="text-sm font-semibold tabular-nums text-brand-600 dark:text-brand-400">
            {range
              ? range.min === range.max
                ? formatBdt(range.min)
                : `${formatBdt(range.min)} – ${formatBdt(range.max)}`
              : "—"}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {variationCount} {t("sales.variantsLabel")} ·{" "}
            {Number.isFinite(totalStock) ? totalStock : 0} {t("sales.stock")}
          </p>
        </div>

        {p?.best_deal ? (
          <span className="w-fit rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-700 dark:bg-success-500/15 dark:text-success-300">
            {t("sales.bestDeal")}
          </span>
        ) : null}
      </div>
    </button>
  );
}
