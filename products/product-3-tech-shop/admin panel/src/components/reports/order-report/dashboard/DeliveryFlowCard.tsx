"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  Box,
  FileText,
  Package,
  PauseCircle,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import type { DeliveryFlowItem, OrderStatusKey } from "../types";

type Props = { items: DeliveryFlowItem[]; isLoading?: boolean };

const iconByKey: Record<OrderStatusKey, React.ReactNode> = {
  new: <FileText className="h-5 w-5" />,
  approved: <ShieldCheck className="h-5 w-5" />,
  processing: <RefreshCcw className="h-5 w-5" />,
  packaging: <Box className="h-5 w-5" />,
  shipped: <Package className="h-5 w-5" />,
  out_for_delivery: <Truck className="h-5 w-5" />,
  delivered: <BadgeCheck className="h-5 w-5" />,
  returned: <RefreshCcw className="h-5 w-5" />,
  cancelled: <XCircle className="h-5 w-5" />,
  on_hold: <PauseCircle className="h-5 w-5" />,
  trash: <Trash2 className="h-5 w-5" />,
};

const DeliveryFlowCard: React.FC<Props> = ({ items, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.orderReport.deliveryFlow")}</div>
      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={`sk-${idx}`} className="flex flex-col items-center text-center gap-2">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((it) => (
            <FlowTile key={it.key} item={it} />
          ))}
        </div>
      )}
    </div>
  );
};

function FlowTile({ item }: { item: DeliveryFlowItem }) {
  const toneClass =
    item.tone === "success"
      ? "bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20"
      : item.tone === "warning"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
        : item.tone === "error"
          ? "bg-error-500/10 text-error-600 dark:text-error-400 border-error-500/20"
          : item.tone === "muted"
            ? "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20"
            : "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20";

  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div
        className={cn(
          "relative h-14 w-14 rounded-xl border flex items-center justify-center",
          "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800",
          "shadow-theme-xs"
        )}
      >
        <span className={cn("text-gray-700 dark:text-gray-200")}>{iconByKey[item.key]}</span>
        <span
          className={cn(
            "absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full border text-xs font-extrabold",
            "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800",
            toneClass
          )}
        >
          {item.qty}
        </span>
      </div>

      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
        {item.label}
      </div>
    </div>
  );
}

export default DeliveryFlowCard;
