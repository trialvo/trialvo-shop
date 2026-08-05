import { Minus, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

export type ComboDealItemView = {
  id: number;
  name: string;
  image?: string | null;
  meta?: string;
  priceLabel?: string;
  have: number;
  need: number;
  stockLow: boolean;
};

export type ComboDealCardProps = {
  name: string;
  discountLabel?: string | null;
  freeDelivery?: boolean;
  itemCount: number;
  items: ComboDealItemView[];
  completeSets: number;
  comboAvailable: boolean;
  insufficientCount: number;
  onAdd: () => void;
  onRemove: () => void;
};

function mosaicCols(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  return "grid-cols-4";
}

/**
 * Combo deal card — mosaic preview, quiet list, clear CTA.
 */
export default function ComboDealCard({
  name,
  discountLabel,
  freeDelivery,
  itemCount,
  items,
  completeSets,
  comboAvailable,
  insufficientCount,
  onAdd,
  onRemove,
}: Readonly<ComboDealCardProps>) {
  const mosaicItems = items.slice(0, 4);
  const extra = Math.max(0, items.length - 4);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div
        className={cn(
          "grid gap-0.5 bg-gray-100 p-0.5 dark:bg-gray-800",
          mosaicCols(mosaicItems.length),
        )}
      >
        {mosaicItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-950"
          >
            {item.image ? (
              <img
                src={toPublicUrl(item.image)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-5 w-5 text-gray-300 dark:text-gray-600" />
              </div>
            )}
            {extra > 0 && index === mosaicItems.length - 1 ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-sm font-semibold text-white">
                +{extra}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
              {name}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
              {freeDelivery ? " · Free delivery" : ""}
            </p>
          </div>
          {discountLabel ? (
            <span className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {discountLabel}
            </span>
          ) : null}
        </div>

        <ul className="mt-3 space-y-2">
          {items.map((item) => {
            const filled = item.have >= item.need;
            return (
              <li key={item.id} className="flex items-center gap-2.5">
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                  {item.image ? (
                    <img
                      src={toPublicUrl(item.image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-3 w-3 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">
                    {item.name}
                    <span className="ml-1 font-normal text-gray-400">
                      ×{item.need}
                    </span>
                  </p>
                  {(item.meta || item.priceLabel) && (
                    <p className="truncate text-[11px] text-gray-400">
                      {[item.meta, item.priceLabel].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold tabular-nums",
                    item.stockLow
                      ? "text-error-600 dark:text-error-400"
                      : filled
                        ? "text-success-600 dark:text-success-400"
                        : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {item.have}/{item.need}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/80 px-3.5 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
        {!comboAvailable ? (
          <p className="mb-2.5 text-xs text-error-600 dark:text-error-400">
            Can’t add — low stock on {insufficientCount} item
            {insufficientCount !== 1 ? "s" : ""}
          </p>
        ) : null}

        {completeSets > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">
                {completeSets}
              </span>{" "}
              set{completeSets !== 1 ? "s" : ""} in cart
            </p>
            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={onRemove}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Remove one combo set"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2.25rem] text-center text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {completeSets}
              </span>
              <button
                type="button"
                onClick={onAdd}
                disabled={!comboAvailable}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600"
                aria-label="Add one combo set"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={!comboAvailable}
            className={cn(
              "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition",
              comboAvailable
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
            )}
          >
            <Plus className="h-4 w-4" />
            Add combo set
          </button>
        )}
      </div>
    </article>
  );
}
