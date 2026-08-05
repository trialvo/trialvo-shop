// src/components/orders/order-editor/OrderEditorHeader.tsx

import type React from "react";
import { Package, Calendar, CreditCard, Shield, FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import type { OrderStatus, PaymentStatus } from "./types";

interface OrderEditorHeaderProps {
  orderNumber: string;
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDateLabel: string;
  paymentLabel: string;
  statusLabel: string;
  customerIp?: string;
}

const statusToBadgeColor = (
  status: OrderStatus,
): "primary" | "success" | "error" | "warning" | "info" => {
  switch (status) {
    case "delivered":
      return "success";
    case "cancelled":
    case "returned":
    case "trash":
      return "error";
    case "on_hold":
      return "warning";
    default:
      return "info";
  }
};

const paymentToBadgeColor = (
  status: PaymentStatus,
): "success" | "error" | "warning" => {
  switch (status) {
    case "paid":
      return "success";
    case "partial_paid":
      return "warning";
    default:
      return "error";
  }
};

const OrderEditorHeader: React.FC<OrderEditorHeaderProps> = ({
  orderNumber,
  orderId,
  orderStatus,
  paymentStatus,
  orderDateLabel,
  paymentLabel,
  statusLabel,
  customerIp,
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Order icon + title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Package size={15} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg dark:text-white">
              Order #{orderNumber}
            </h1>
          </div>
        </div>

        {/* Separator dot */}
        <div className="hidden h-4 w-px bg-gray-200 sm:block dark:bg-gray-700" />

        {/* Date chip */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Calendar size={12} className="text-gray-400" />
          <span className="font-medium">{orderDateLabel}</span>
        </div>

        {/* Separator dot */}
        <div className="hidden h-4 w-px bg-gray-200 sm:block dark:bg-gray-700" />

        {/* Payment + Status badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CreditCard size={12} className="text-gray-400" />
            <Badge
              variant="light"
              size="md"
              color={paymentToBadgeColor(paymentStatus)}
            >
              {paymentStatus.toUpperCase()}
            </Badge>
          </div>
          <Badge variant="light" size="md" color={statusToBadgeColor(orderStatus)}>
            {statusLabel}
          </Badge>
        </div>

        {/* IP badge (if exists) */}
        {customerIp ? (
          <>
            <div className="hidden h-4 w-px bg-gray-200 sm:block dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <Shield size={11} className="text-gray-400" />
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {customerIp}
              </span>
            </div>
          </>
        ) : null}

        {/* Payment label */}
        <span className="hidden text-[11px] text-gray-400 sm:inline dark:text-gray-500">
          {paymentLabel}
        </span>

        {/* Spacer */}
        <div className="ml-auto" />

        {/* Invoice button */}
        <Button
          size="sm"
          variant="outline"
          startIcon={<FileDown size={13} />}
          onClick={() => window.open(`/order-invoice/${orderId}`, "_blank")}
        >
          Preview Invoice
        </Button>
      </div>
    </div>
  );
};

export default OrderEditorHeader;
