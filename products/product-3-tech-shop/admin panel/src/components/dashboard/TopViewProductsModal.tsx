import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Modal } from "../ui/modal";
import PaginationFooter from "./PaginationFooter";
import TopViewedRangeFilter from "./TopViewedRangeFilter";

import {
  dashboardKeys,
  getDashboardTopViewed,
  type DashboardTopViewedItem,
  type TopViewedTimeRange,
} from "@/api/dashboard.api";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";

interface Props {
  open: boolean;
  onClose: () => void;

  timeRange: TopViewedTimeRange;
  onChangeTimeRange: (v: TopViewedTimeRange) => void;
}

const PAGE_SIZE = 10;

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

function formatBDT(n: number): string {
  if (!Number.isFinite(n)) return "৳0";
  const formatted = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n);
  return `৳${formatted}`;
}

const TopViewProductsModal: React.FC<Props> = ({ open, onClose, timeRange, onChangeTimeRange }) => {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open, timeRange]);

  const offset = (page - 1) * PAGE_SIZE;

  const query = useQuery({
    queryKey: dashboardKeys.topViewedList({ timeRange, limit: PAGE_SIZE, offset }),
    queryFn: () => getDashboardTopViewed({ timeRange, limit: PAGE_SIZE, offset }),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const rows: DashboardTopViewedItem[] = query.data?.data ?? [];
  const total = query.data?.meta?.count ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Modal isOpen={open} onClose={onClose} className="w-full max-w-[980px] max-h-[720px] overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {t("dashboard.topViewed.title")}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {query.isError ? t("dashboard.topViewed.failed") : t("dashboard.topViewed.totalItems", { count: total })}
            </p>
          </div>

          <TopViewedRangeFilter
            value={timeRange}
            onChange={(v) => {
              onChangeTimeRange(v);
            }}
          />
        </div>
      </div>

      <div className="max-h-[calc(720px-72px)] overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-12 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
          <div className="col-span-7">{t("dashboard.topViewed.tableProduct")}</div>
          <div className="col-span-2 text-center">{t("dashboard.topViewed.tableView")}</div>
          <div className="col-span-3 text-right">{t("dashboard.topViewed.tableLastVisit")}</div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {query.isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
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
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.topViewed.noData")}
            </div>
          ) : (
            rows.map((p) => {
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

        <PaginationFooter total={total} page={page} pageSize={PAGE_SIZE} onPrev={onPrev} onNext={onNext} />
      </div>
    </Modal>
  );
};

export default TopViewProductsModal;
