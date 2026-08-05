import type React from "react";
import { Clock, MessageSquare, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

import type { OrderStatus } from "./types";

interface SidebarCustomerHistoryCardProps {
  orderId: string;
  shipping: string;
  orderDateLabel: string;
  totalAmount: number;
  timeAgo: string;
  orderStatus: OrderStatus;
  sentBy: "manually" | "auto";
  additionalNotes: string;
  onDownloadInvoice: () => void;
}

const statusLabel = (status: OrderStatus): string => {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const formatBDT = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const SidebarCustomerHistoryCard: React.FC<SidebarCustomerHistoryCardProps> = ({
  orderId,
  shipping,
  orderDateLabel,
  totalAmount,
  timeAgo,
  orderStatus,
  sentBy,
  additionalNotes,
  onDownloadInvoice,
}) => {
  const { t } = useTranslation();
  const rows = [
    { label: t("orders.orderEditor.orderId"), value: orderId },
    { label: t("orders.orderEditor.shipping"), value: shipping },
    { label: t("orders.orderEditor.orderDate"), value: orderDateLabel },
    { label: t("orders.orderEditor.totalAmount"), value: `${formatBDT(totalAmount)} BDT`, bold: true },
    { label: t("orders.orderEditor.time"), value: timeAgo },
    { label: t("orders.orderEditor.orderStatus"), value: statusLabel(orderStatus) },
    { label: t("orders.orderEditor.sentBy"), value: sentBy === "auto" ? t("orders.orderEditor.auto") : t("orders.orderEditor.manually") },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
          <Clock size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            {t("orders.orderEditor.history")}
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("orders.orderEditor.customerTimeline")}
          </div>
        </div>
      </div>

      {/* Data rows */}
      <div className="mt-3.5 space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map(({ label, value, bold }) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2 text-xs sm:text-sm">
            <span className="shrink-0 text-gray-500 dark:text-gray-400">{label}</span>
            <span
              className={`truncate text-right ${bold ? "font-extrabold" : "font-semibold"} text-gray-900 dark:text-white`}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {additionalNotes ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2.5 dark:border-gray-800 dark:bg-gray-800/50">
          <MessageSquare size={13} className="mt-0.5 shrink-0 text-gray-400" />
          <div className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
            {additionalNotes}
          </div>
        </div>
      ) : null}


    </div>
  );
};

export default SidebarCustomerHistoryCard;
