import { cn } from "@/lib/utils";
import React from "react";
import type { OrderStatus } from "./types";

type Props = {
  status: string | OrderStatus;
};

const isValidOrderStatus = (status: string): status is OrderStatus => {
  return ['new', 'approved', 'processing', 'shipped', 'delivered', 'cancelled', 'canceled', 'trash'].includes(status);
};

const normalizeStatus = (status: string): OrderStatus => {
  const normalized = status.toLowerCase();
  if (isValidOrderStatus(normalized)) {
    return normalized;
  }
  return 'new';
};

function getStatusBadge(orderStatus: OrderStatus): { label: string; className: string } {
  const s = String(orderStatus ?? "").toLowerCase();

  if (s === "new") {
    return { label: "Pending", className: "bg-[#FF8D2814] text-[#FF8D28]" };
  }
  if (s === "approved") {
    return { label: "Confirmed", className: "bg-[#0088FF14] text-[#0088FF]" };
  }
  if (s === "processing" || s === "shipped") {
    return { label: "Possessing", className: "bg-[#00C8B314] text-[#00C8B3]" };
  }
  if (s === "delivered" || s === "completed") {
    return { label: "Completed", className: "bg-[#34C75914] text-[#34C759]" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { label: "Canceled", className: "bg-[#FF383C14] text-[#FF383C]" };
  }
  if (s === "trash") {
    return { label: "Trash", className: "bg-[#F2F2F2] text-[#6B7280]" };
  }

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  return { label, className: "bg-[#F2F2F2] text-[#6B7280]" };
}

const OrderStatusPill: React.FC<Props> = ({ status }) => {
  const normalizedStatus = normalizeStatus(String(status));
  const badge = getStatusBadge(normalizedStatus);

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center",
        "px-2 py-1.25",
        "text-xs font-medium",
        "rounded-none",
        badge.className
      )}
    >
      {badge.label}
    </span>
  );
};

export default OrderStatusPill;