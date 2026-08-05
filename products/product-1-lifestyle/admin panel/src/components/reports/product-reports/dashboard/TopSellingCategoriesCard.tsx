"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon } from "lucide-react";
import { toPublicUrl } from "@/utils/toPublicUrl";
import type { ProductTopSellingCategory } from "@/api/product-metrics.api";
import { parseMoney, formatBdt } from "../reportUtils";

type Props = {
  isLoading?: boolean;
  main: ProductTopSellingCategory[];
  sub: ProductTopSellingCategory[];
  child: ProductTopSellingCategory[];
};

type TabKey = "main" | "sub" | "child";

const TopSellingCategoriesCard: React.FC<Props> = ({ isLoading, main, sub, child }) => {
  const { t } = useTranslation();
  const [tab, setTab] = React.useState<TabKey>("main");

  const list = tab === "main" ? main : tab === "sub" ? sub : child;

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.productReport.topSellingCategories")}</div>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400" />
        </div>

        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <TabButton active={tab === "main"} onClick={() => setTab("main")}>{t("reports.productReport.main")}</TabButton>
          <TabButton active={tab === "sub"} onClick={() => setTab("sub")}>{t("reports.productReport.sub")}</TabButton>
          <TabButton active={tab === "child"} onClick={() => setTab("child")}>{t("reports.productReport.child")}</TabButton>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((c) => {
            const revenue = parseMoney(c.revenue);
            const img = c.image ? toPublicUrl(c.image) : null;

            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-xl border border-gray-200 dark:border-gray-800",
                  "bg-white dark:bg-gray-950",
                  "p-4"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {c.name}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {t("reports.productReport.sold")}: <span className="font-semibold text-gray-900 dark:text-white">{c.sold_count}</span>
                      </span>
                      <span>
                        {t("reports.productReport.orders")}: <span className="font-semibold text-gray-900 dark:text-white">{c.order_count}</span>
                      </span>
                      <span className="ml-auto">
                        {t("reports.productReport.revenue")}:{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatBdt(revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {list.length === 0 && (
            <div className="col-span-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
              {t("reports.common.noData")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-lg px-3 text-sm font-semibold transition",
        active
          ? "bg-brand-500 text-white shadow-theme-xs"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.04] dark:hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

export default TopSellingCategoriesCard;
