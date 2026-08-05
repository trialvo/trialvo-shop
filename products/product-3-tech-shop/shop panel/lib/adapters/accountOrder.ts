import type {
  OrderListItem,
  OrderStatus,
  PaymentStatus,
} from "@/lib/api/order/service";
import { sanitizeAuthText } from "@/lib/security/auth";

export type AccountOrderTabKey = "all" | "to-pay" | "completed" | "canceled";

export type AccountOrderRowViewModel = {
  id: number;
  orderIdLabel: string;
  placedAtLabel: string;
  status: OrderStatus | string;
  statusLabel: string;
  paymentStatus: PaymentStatus | string;
  paymentStatusLabel: string;
  paymentTypeLabel: string;
  totalLabel: string;
  itemCount: number;
  canPay: boolean;
  canCancel: boolean;
  canTrack: boolean;
};

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function paymentTypeLabel(type: string | undefined): string {
  switch (type) {
    case "cod":
      return "Cash on Delivery";
    case "gateway":
      return "Online Payment";
    case "mixed":
      return "Mixed";
    default:
      return sanitizeAuthText(type ?? "—", 40);
  }
}

export function toAccountOrderRow(
  order: OrderListItem,
): AccountOrderRowViewModel {
  const status = String(order.order_status || "").toLowerCase();
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  const isCanceled = status === "cancelled" || status === "trash";
  const isDelivered = status === "delivered" || status === "returned";
  const unpaid = paymentStatus === "unpaid";

  const total = Number(order.grand_total ?? order.total ?? 0) || 0;
  const placed = order.created_at || order.placed_at || "";

  return {
    id: order.id,
    orderIdLabel: `#${order.id}`,
    placedAtLabel: placed
      ? new Date(placed).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—",
    status,
    statusLabel: formatStatus(status || "unknown"),
    paymentStatus,
    paymentStatusLabel: formatStatus(paymentStatus || "unknown"),
    paymentTypeLabel: paymentTypeLabel(order.payment_type),
    totalLabel: `৳${total.toLocaleString()}`,
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
    canPay: unpaid && !isCanceled,
    canCancel: !isCanceled && !isDelivered && status !== "shipped" && status !== "out_for_delivery",
    canTrack: !isCanceled,
  };
}

export function orderStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "delivered" || s === "returned") {
    return "bg-green-100 text-green-700";
  }
  if (s === "cancelled" || s === "trash") {
    return "bg-red-100 text-red-700";
  }
  if (s === "on_hold") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-blue-100 text-blue-700";
}
