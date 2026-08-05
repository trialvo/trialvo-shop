import * as React from "react";
import { MapPin } from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Modal } from "../ui/modal";
import PaginationFooter from "./PaginationFooter";
import TopViewedRangeFilter from "./TopViewedRangeFilter";

import {
  dashboardKeys,
  getDashboardTopSellingArea,
  type DashboardTimeRange,
  type DashboardTopSellingAreaItem,
} from "@/api/dashboard.api";

const PAGE_SIZE = 10;

interface Props {
  open: boolean;
  onClose: () => void;

  timeRange: DashboardTimeRange;
  onChangeTimeRange: (v: DashboardTimeRange) => void;
}

function formatBDTFromString(v: string): string {
  const n = Number.parseFloat(v);
  if (!Number.isFinite(n)) return "৳0";
  const formatted = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n);
  return `৳${formatted}`;
}

function titleCase(s: string): string {
  if (!s) return "—";
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function revenueNumber(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

const TopSellingDistrictModal: React.FC<Props> = ({ open, onClose, timeRange, onChangeTimeRange }) => {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [open, timeRange]);

  const offset = (page - 1) * PAGE_SIZE;

  const query = useQuery({
    queryKey: dashboardKeys.topSellingAreaList({ timeRange, limit: PAGE_SIZE, offset }),
    queryFn: () => getDashboardTopSellingArea({ timeRange, limit: PAGE_SIZE, offset }),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const rows: DashboardTopSellingAreaItem[] = query.data?.data ?? [];
  const total = query.data?.meta?.count ?? 0;

  const maxRevenue = React.useMemo(() => {
    if (!rows.length) return 0;
    return Math.max(...rows.map((r) => revenueNumber(r.total_revenue)));
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <Modal isOpen={open} onClose={onClose} className="w-full max-w-[980px] max-h-[720px] overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              {t("dashboard.topSellingDistrict.title")}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {query.isError ? t("dashboard.topSellingDistrict.failed") : t("dashboard.topSellingDistrict.totalEntries", { count: total })}
            </p>
          </div>

          <TopViewedRangeFilter value={timeRange} onChange={onChangeTimeRange} />
        </div>
      </div>

      <div className="max-h-[calc(720px-72px)] overflow-y-auto px-6 py-4">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {query.isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4 py-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse dark:bg-gray-800" />
                <div className="flex-1">
                  <div className="h-4 w-40 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
                  <div className="mt-3 h-2 w-full rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
                </div>
                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse dark:bg-gray-800" />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="py-6 text-sm text-gray-500 dark:text-gray-400">{t("dashboard.topSellingDistrict.noData")}</div>
          ) : (
            rows.map((d) => {
              const revenue = revenueNumber(d.total_revenue);
              const percent = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;

              return (
                <div key={d.zone} className="flex items-center gap-4 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full ring-1 ring-gray-200 dark:ring-gray-800">
                    <MapPin className="text-brand-600 dark:text-brand-400" size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white/90">
                        {titleCase(d.zone)}
                      </p>

                      <p className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {t("dashboard.topSellingDistrict.orders")}: {" "}
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{d.total_orders}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-700">•</span>
                        {t("dashboard.topSellingDistrict.items")}: {" "}
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{d.total_items_sold}</span>
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
                      </div>

                      <p className="w-[72px] text-right text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <p className="w-[120px] text-right text-sm font-semibold text-gray-900 dark:text-white/90">
                    {formatBDTFromString(d.total_revenue)}
                  </p>
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

export default TopSellingDistrictModal;
