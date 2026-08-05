import * as React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import Select, { type Option } from "@/components/form/Select";
import {
  dashboardKeys,
  getDashboardYearlyStatistic,
  type DashboardYearlyStatisticItem,
} from "@/api/dashboard.api";

function parseMoney(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function formatBDT(n: number): string {
  if (!Number.isFinite(n)) return "৳0";
  const formatted = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n);
  return `৳${formatted}`;
}

const MONTH_KEYS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function normalizeYearlyRows(rows: DashboardYearlyStatisticItem[] | undefined) {
  const byMonth = new Map<string, DashboardYearlyStatisticItem>();
  (rows ?? []).forEach((r) => byMonth.set(r.month, r));

  const revenue = MONTH_KEYS.map((m) => parseMoney(byMonth.get(m)?.revenue ?? "0"));
  const profit = MONTH_KEYS.map((m) => parseMoney(byMonth.get(m)?.profit ?? "0"));

  return { revenue, profit };
}

function buildYearsList(currentYear: number) {
  // current year + previous 6 years (adjust if you want)
  const years: number[] = [];
  for (let i = 0; i < 7; i += 1) years.push(currentYear - i);
  return years;
}

const StatisticsChart: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = React.useState<number>(currentYear);

  const years = React.useMemo(() => buildYearsList(currentYear), [currentYear]);
  const yearOptions = React.useMemo<Option[]>(
    () => years.map((y) => ({ value: String(y), label: String(y) })),
    [years],
  );

  const query = useQuery({
    queryKey: dashboardKeys.yearlyStatisticByYear(year),
    queryFn: () => getDashboardYearlyStatistic(year),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const { revenue, profit } = React.useMemo(() => normalizeYearlyRows(query.data?.data), [query.data?.data]);

  const monthLabels = React.useMemo(() => {
    const translated = t("dashboard.statistics.months", { returnObjects: true }) as string[] | string;
    if (Array.isArray(translated) && translated.length === 12) return translated;
    return [...MONTH_KEYS];
  }, [t, i18n.language]);

  const options: ApexOptions = React.useMemo(
    () => ({
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        labels: {
          colors: undefined,
        },
      },
      colors: ["#465FFF", "#9CB9FF"],
      chart: {
        fontFamily: "var(--font-base), Outfit, sans-serif",
        height: 310,
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: {
        curve: "straight",
        width: [2, 2],
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.45,
          opacityTo: 0,
        },
      },
      markers: {
        size: 0,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: { size: 6 },
      },
      grid: {
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: { enabled: false },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => formatBDT(val),
          title: {
            formatter: (seriesName: string) => seriesName,
          },
        },
      },
      xaxis: {
        type: "category",
        categories: monthLabels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
          formatter: (val: number) => {
            if (!Number.isFinite(val)) return "0";
            return new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(val);
          },
        },
        title: { text: "", style: { fontSize: "0px" } },
      },
    }),
    [monthLabels]
  );

  const series = React.useMemo(
    () => [
      { name: t("dashboard.statistics.revenue"), data: revenue },
      { name: t("dashboard.statistics.profit"), data: profit },
    ],
    [revenue, profit, t]
  );

  const headerRight = (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {query.isError
            ? t("dashboard.statistics.failed")
            : query.isFetching
              ? t("dashboard.statistics.updating")
              : t("dashboard.statistics.yearlySummary")}
        </p>
      </div>

      <Select
        options={yearOptions}
        value={String(year)}
        onChange={(value) => setYear(Number(value))}
        className={cn("min-w-[120px]")}
        menuClassName="max-h-56"
      />
    </div>
  );

  return (
    <div className="w-full flex-1 rounded-2xl bg-white px-5 pb-5 pt-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] transition-shadow duration-300 ease-out dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)] sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("dashboard.statistics.title")}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("dashboard.statistics.subtitle", { year: query.data?.year ?? year })}
          </p>
        </div>

        {headerRight}
      </div>

      {/* Chart / Loading */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[700px] xl:min-w-full">
          {query.isLoading ? (
            <div className="h-[310px] w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsChart;
