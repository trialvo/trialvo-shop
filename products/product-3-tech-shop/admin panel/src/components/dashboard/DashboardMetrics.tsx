import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, Users, XCircle } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import MetricCard, { MetricsRange } from "./MetricCard";
import MetricsFilter from "./MetricsFilter";

import {
  dashboardKeys,
  getDashboardOverview,
  type OverviewBucket,
  type OverviewBucketKey,
} from "@/api/dashboard.api";

function rangeToApiKey(range: MetricsRange): OverviewBucketKey {
  // API uses "today" not "day"
  if (range === "day") return "today";
  return range;
}

function formatCompactNumber(n: number): string {
  // Orders/Views can stay compact
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatBDT(n: number): string {
  // ✅ NO K/M compact. Always show full amount in BDT.
  if (!Number.isFinite(n)) return "৳0";

  const formatted = new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(n);

  return `৳${formatted}`;
}

function formatPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n;
}

function rangeLabel(range: MetricsRange, t: (key: string, options?: any) => string): string {
  if (range === "day") return t("dashboard.range.today");
  return t("dashboard.range.this", { range: t(`dashboard.range.${range}`) });
}

function lastRangeLabel(range: MetricsRange, t: (key: string, options?: any) => string): string {
  if (range === "day") return t("dashboard.range.yesterday");
  return t("dashboard.range.last", { range: t(`dashboard.range.${range}`) });
}

function getTrendUp(pct: number): boolean {
  // treat 0 as neutral/up
  return pct >= 0;
}

const DashboardMetrics: React.FC = () => {
  const { t } = useTranslation();
  const [range, setRange] = React.useState<MetricsRange>("month");

  const overviewQuery = useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: getDashboardOverview,
    staleTime: 30_000,
  });

  const bucketKey = rangeToApiKey(range);

  const bucket: OverviewBucket | undefined = overviewQuery.data?.overview?.[bucketKey];

  const loading = overviewQuery.isLoading;

  const cards = React.useMemo(() => {
    const current = bucket?.current;
    const last = bucket?.last;
    const change = bucket?.change;

    const safeCurrent = current ?? {
      total_orders: 0,
      total_sales: 0,
      total_cancelled: 0,
      total_views: 0,
    };

    const safeLast = last ?? {
      total_orders: 0,
      total_sales: 0,
      total_cancelled: 0,
      total_views: 0,
    };

    const safeChange = change ?? {
      total_orders: 0,
      total_sales: 0,
      total_cancelled: 0,
      total_views: 0,
    };

    return [
      {
        key: "orders",
        title: t("dashboard.metrics.totalOrders"),
        value: formatCompactNumber(safeCurrent.total_orders),
        changePercent: formatPercent(safeChange.total_orders),
        subLeftText: `${formatCompactNumber(safeCurrent.total_orders)} ${rangeLabel(range, t)}`,
        subRightText: t("dashboard.metrics.vsLast", { range: lastRangeLabel(range, t) }),
        trendUp: getTrendUp(safeChange.total_orders),
        icon: <ShoppingCart size={16} />,
        lastValue: safeLast.total_orders,
      },
      {
        key: "sales",
        title: t("dashboard.metrics.totalSales"),
        value: formatBDT(safeCurrent.total_sales),
        changePercent: formatPercent(safeChange.total_sales),
        subLeftText: `${formatBDT(safeCurrent.total_sales)} ${rangeLabel(range, t)}`,
        subRightText: t("dashboard.metrics.vsLast", { range: lastRangeLabel(range, t) }),
        trendUp: getTrendUp(safeChange.total_sales),
        icon: <DollarSign size={16} />,
        lastValue: safeLast.total_sales,
      },
      {
        key: "cancelled",
        title: t("dashboard.metrics.cancelledOrders"),
        value: formatCompactNumber(safeCurrent.total_cancelled),
        changePercent: formatPercent(safeChange.total_cancelled),
        subLeftText: `${formatCompactNumber(safeCurrent.total_cancelled)} ${rangeLabel(range, t)}`,
        subRightText: t("dashboard.metrics.vsLast", { range: lastRangeLabel(range, t) }),
        trendUp: getTrendUp(safeChange.total_cancelled),
        icon: <XCircle size={16} />,
        lastValue: safeLast.total_cancelled,
      },
      {
        key: "views",
        title: t("dashboard.metrics.totalVisitor"),
        value: formatCompactNumber(safeCurrent.total_views),
        changePercent: formatPercent(safeChange.total_views),
        subLeftText: `${formatCompactNumber(safeCurrent.total_views)} ${rangeLabel(range, t)}`,
        subRightText: t("dashboard.metrics.vsLast", { range: lastRangeLabel(range, t) }),
        trendUp: getTrendUp(safeChange.total_views),
        icon: <Users size={16} />,
        lastValue: safeLast.total_views,
      },
    ];
  }, [bucket, range, t]);

  return (
    <section>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("dashboard.metrics.overviewTitle")}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {overviewQuery.isError
              ? t("dashboard.metrics.failedOverview")
              : t("dashboard.metrics.showingSummary", { range: rangeLabel(range, t) })}
          </p>
        </div>

        <MetricsFilter value={range} onChange={setRange} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
        {cards.map((c) => (
          <MetricCard
            key={c.key}
            title={c.title}
            value={c.value}
            changePercent={c.changePercent}
            subLeftText={c.subLeftText}
            subRightText={c.subRightText}
            trendUp={c.trendUp}
            icon={c.icon}
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
};

export default DashboardMetrics;
