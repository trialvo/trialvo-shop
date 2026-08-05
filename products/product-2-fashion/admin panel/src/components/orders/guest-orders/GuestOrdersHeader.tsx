"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import type { GuestOrderStatus } from "./types";

type Tab = { label: string; value: "all" | GuestOrderStatus };

type Props = {
  title: string;
  tabs: Tab[];
  activeTab: "all" | GuestOrderStatus;
  onTabChange: (v: "all" | GuestOrderStatus) => void;
  badgeCounts: Record<"all" | GuestOrderStatus, number>;
};

const GuestOrdersHeader: React.FC<Props> = ({
  title,
  tabs,
  activeTab,
  onTabChange,
  badgeCounts,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("guestOrders.subtitle")}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const active = activeTab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onTabChange(t.value)}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
              ].join(" ")}
            >
              <span>{t.label}</span>
              <span className={active ? "text-white/90" : "text-gray-500 dark:text-gray-400"}>
                ({badgeCounts[t.value]})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GuestOrdersHeader;
export { GuestOrdersHeader };
