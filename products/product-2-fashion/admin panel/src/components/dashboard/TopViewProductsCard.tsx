import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import TopViewProductsModal from "./TopViewProductsModal";
import TopViewedRangeFilter from "./TopViewedRangeFilter";

import {
  dashboardKeys,
  getDashboardTopViewed,
  type DashboardTopViewedItem,
  type TopViewedTimeRange,
} from "@/api/dashboard.api";
import { cn } from "@/lib/utils";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";

const PAGE_SIZE = 10;

function formatBDT(n: number): string {
  if (!Number.isFinite(n)) return "৳0";
  const formatted = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n);
  return `৳${formatted}`;
}

function formatLastViewed(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TopViewProductsCard: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<TopViewedTimeRange>("all");

  const query = useQuery({
    queryKey: dashboardKeys.topViewedList({ timeRange, limit: PAGE_SIZE, offset: 0 }),
    queryFn: () => getDashboardTopViewed({ timeRange, limit: PAGE_SIZE, offset: 0 }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const preview: DashboardTopViewedItem[] = query.data?.data ?? [];
  const totalCount = query.data?.meta?.count ?? 0;

  return (
    <div className="h-full w-full rounded-2xl bg-white px-5 pb-5 pt-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] transition-shadow duration-300 ease-out dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)] sm:px-6 sm:pt-6 flex flex-col">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            {t("dashboard.topViewed.title")}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {query.isError ? t("dashboard.topViewed.failed") : t("dashboard.topViewed.showingTop", { count: PAGE_SIZE })}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <TopViewedRangeFilter
            value={timeRange}
            onChange={(v) => {
              setTimeRange(v);
            }}
          />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn("text-sm font-semibold text-brand-600 hover:text-brand-700", "dark:text-brand-400")}
          >
            {t("dashboard.topViewed.viewMore")}
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
        <div className="col-span-7">{t("dashboard.topViewed.tableProduct")}</div>
        <div className="col-span-2 text-center">{t("dashboard.topViewed.tableView")}</div>
        <div className="col-span-3 text-right">{t("dashboard.topViewed.tableLastVisit")}</div>
      </div>

      {/* Body */}
      <div className="flex-1">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {query.isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-4">
                <div className="col-span-7 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-800" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <div className="h-4 w-10 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
                </div>
                <div className="col-span-3 flex items-center justify-end">
                  <div className="h-4 w-24 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
                </div>
              </div>
            ))
          ) : preview.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.topViewed.noData")}
            </div>
          ) : (
            preview.map((p) => {
              const fallback = imageFallbackSvgDataUri(p.name);
              const img = p.image ? toPublicUrl(p.image) : fallback;

              return (
                <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-4">
                  <div className="col-span-7 flex items-center gap-3">
                    <img
                      src={img}
                      alt={p.name}
                      className="h-12 w-12 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-800"
                      loading="lazy"
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-600 dark:text-brand-400">{p.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">
                          {t("dashboard.topViewed.slug")}: {p.slug}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>
                          {t("dashboard.topViewed.price")}: {formatBDT(p.selling_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-white/90">
                    {p.view_count}
                  </div>

                  <div className="col-span-3 flex items-center justify-end text-sm text-gray-700 dark:text-gray-300">
                    {formatLastViewed(p.last_viewed)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{t("dashboard.topViewed.totalEntries", { count: totalCount })}</span>
        <span className="text-gray-400">→</span>
      </div>

      <TopViewProductsModal
        open={open}
        onClose={() => setOpen(false)}
        timeRange={timeRange}
        onChangeTimeRange={setTimeRange}
      />
    </div>
  );
};

export default TopViewProductsCard;
