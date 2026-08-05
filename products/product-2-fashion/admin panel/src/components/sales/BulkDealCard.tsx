import { Minus, Package, Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

export type BulkDealTierView = {
  id: number;
  minQty: number;
  discountLabel: string;
  freeDelivery: boolean;
  qualifies: boolean;
  isActive: boolean;
  unavailable: boolean;
  progress: number;
  currentQty: number;
};

export type BulkDealCardProps = {
  title: string;
  image?: string | null;
  meta?: string;
  skuLabel: string;
  priceLabel?: string;
  freeDelivery: boolean;
  stock: number;
  stockIssue: boolean;
  outOfStock: boolean;
  lowestMinQty: number;
  currentQty: number;
  activeDiscountLabel?: string | null;
  tiers: BulkDealTierView[];
  onAdd: () => void;
  onRemove: () => void;
  canAddMore: boolean;
};

/**
 * Bulk deal card — product focus + clean tier ladder.
 */
export default function BulkDealCard({
  title,
  image,
  meta,
  skuLabel,
  priceLabel,
  freeDelivery,
  stock,
  stockIssue,
  outOfStock,
  lowestMinQty,
  currentQty,
  activeDiscountLabel,
  tiers,
  onAdd,
  onRemove,
  canAddMore,
}: Readonly<BulkDealCardProps>) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex gap-3 p-3">
        <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          {image ? (
            <img
              src={toPublicUrl(image)}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              {meta ? (
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {meta}
                </p>
              ) : null}
              <p className="mt-0.5 truncate text-[11px] text-gray-400">
                {skuLabel}
                {freeDelivery ? " · Free delivery" : ""}
              </p>
            </div>
            {priceLabel ? (
              <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {priceLabel}
              </p>
            ) : null}
          </div>

          {stockIssue ? (
            <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">
              {outOfStock
                ? "Out of stock"
                : `Only ${stock} left — need ${lowestMinQty}+ for this deal`}
            </p>
          ) : activeDiscountLabel ? (
            <p className="mt-1.5 text-xs font-medium text-success-600 dark:text-success-400">
              Active · {activeDiscountLabel}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Stock {stock}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-start">
          {stockIssue ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
              title="Insufficient stock"
            >
              <ShoppingBag className="h-4 w-4 text-gray-400" />
            </div>
          ) : currentQty > 0 ? (
            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/60">
              <button
                type="button"
                onClick={onRemove}
                disabled={currentQty <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-700 transition hover:bg-white disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label={`Remove ${lowestMinQty}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {currentQty}
              </span>
              <button
                type="button"
                onClick={onAdd}
                disabled={!canAddMore}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600"
                aria-label={`Add ${lowestMinQty}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 items-center gap-1 rounded-xl bg-brand-500 px-3 text-xs font-semibold text-white transition hover:bg-brand-600"
              title={`Add ${lowestMinQty} to cart`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add {lowestMinQty}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "flex items-center gap-3 border-l-2 px-3 py-2.5 text-xs transition",
              tier.isActive
                ? "border-l-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                : "border-l-transparent",
              tier.unavailable && "opacity-50",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-800 dark:text-gray-100">
                Buy {tier.minQty}+
                <span className="ml-2 font-semibold text-brand-600 dark:text-brand-400">
                  {tier.discountLabel}
                </span>
                {tier.freeDelivery ? (
                  <span className="ml-1.5 font-normal text-gray-400">
                    · Free delivery
                  </span>
                ) : null}
              </p>
              {tier.unavailable ? (
                <p className="mt-0.5 text-[11px] text-error-500">Not enough stock</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        tier.qualifies ? "bg-success-500" : "bg-brand-400",
                      )}
                      style={{ width: `${Math.round(tier.progress * 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 tabular-nums text-[11px] text-gray-400">
                    {tier.currentQty}/{tier.minQty}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
