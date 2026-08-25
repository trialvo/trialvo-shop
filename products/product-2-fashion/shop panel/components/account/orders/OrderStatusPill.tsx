import { cn } from "@/lib/utils";
import React from "react";
import type { OrderStatus } from "./types";

type Props = {
  status: string | OrderStatus;
};

const isValidOrderStatus = (status: string): status is OrderStatus => {
  return [
    "new",
    "approved",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "canceled",
    "trash",
  ].includes(status);
};

const normalizeStatus = (status: string): OrderStatus => {
  const normalized = status.toLowerCase();
  if (isValidOrderStatus(normalized)) {
    return normalized;
  }
  return "new";
};

function getStatusBadge(orderStatus: OrderStatus): { label: string; className: string } {
  const s = String(orderStatus ?? "").toLowerCase();

  if (s === "new") {
    return { label: "Pending", className: "bg-[#FFF4EB] text-[#D97706]" };
  }
  if (s === "approved") {
    return { label: "Confirmed", className: "bg-[#EFF6FF] text-[#2563EB]" };
  }
  if (s === "processing" || s === "shipped") {
    return { label: "Processing", className: "bg-[#ECFDF5] text-[#0D9488]" };
  }
  if (s === "delivered" || s === "completed") {
    return { label: "Completed", className: "bg-[#ECFDF3] text-[#16A34A]" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { label: "Canceled", className: "bg-[#FEF2F2] text-[#DC2626]" };
  }
  if (s === "trash") {
    return { label: "Trash", className: "bg-[#F3F4F6] text-[#6B7280]" };
  }

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  return { label, className: "bg-[#F3F4F6] text-[#6B7280]" };
}

const OrderStatusPill: React.FC<Props> = ({ status }) => {
  const normalizedStatus = normalizeStatus(String(status));
  const badge = getStatusBadge(normalizedStatus);

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-sm px-2 py-0.5",
        "text-xs font-medium transition-colors duration-200",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
};

export default OrderStatusPill;
