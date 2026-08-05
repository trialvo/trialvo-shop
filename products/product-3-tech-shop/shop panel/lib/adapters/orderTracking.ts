import type {
  OrderStatus,
  OrderStatusHistory,
  TrackOrderResponse,
} from "@/lib/api/order/service";
import { sanitizeAuthText } from "@/lib/security/auth";

export type TrackingStepViewModel = {
  key: string;
  label: string;
  date: string;
  done: boolean;
  current: boolean;
};

export type OrderTrackingViewModel = {
  orderId: string;
  statusLabel: string;
  statusTone: "warning" | "success" | "muted" | "destructive";
  estimatedNote: string;
  steps: TrackingStepViewModel[];
};

const STATUS_PIPELINE: { status: OrderStatus; label: string }[] = [
  { status: "new", label: "Order Placed" },
  { status: "approved", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "packaging", label: "Packaging" },
  { status: "shipped", label: "Shipped" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

const STATUS_INDEX: Record<string, number> = Object.fromEntries(
  STATUS_PIPELINE.map((s, i) => [s.status, i]),
);

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return sanitizeAuthText(raw, 40);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: OrderStatus | string | undefined): string {
  if (!status) return "Unknown";
  const found = STATUS_PIPELINE.find((s) => s.status === status);
  if (found) return found.label;
  return sanitizeAuthText(String(status).replace(/_/g, " "), 40);
}

function statusTone(
  status: OrderStatus | string | undefined,
): OrderTrackingViewModel["statusTone"] {
  if (status === "delivered") return "success";
  if (status === "cancelled" || status === "returned" || status === "trash") {
    return "destructive";
  }
  if (status === "on_hold") return "muted";
  return "warning";
}

function latestTimestamp(
  updates: OrderStatusHistory[] | undefined,
  status: OrderStatus,
): string {
  if (!updates?.length) return "";
  const match = [...updates]
    .reverse()
    .find((u) => u.new_status === status);
  return formatDate(match?.created_at);
}

/**
 * Map track API payload → UI timeline (keeps existing tracking page layout).
 */
export function toOrderTrackingViewModel(
  orderId: string,
  res: TrackOrderResponse,
): OrderTrackingViewModel {
  const currentStatus = res.status ?? res.updates?.at(-1)?.new_status;
  const currentIdx =
    currentStatus && STATUS_INDEX[currentStatus] !== undefined
      ? STATUS_INDEX[currentStatus]
      : 0;

  const terminalFail =
    currentStatus === "cancelled" ||
    currentStatus === "returned" ||
    currentStatus === "trash";

  const steps: TrackingStepViewModel[] = STATUS_PIPELINE.map((step, index) => {
    const done = !terminalFail && index <= currentIdx;
    const current = !terminalFail && index === currentIdx;
    return {
      key: step.status,
      label: step.label,
      date: latestTimestamp(res.updates, step.status) || (current ? "In progress" : ""),
      done,
      current,
    };
  });

  if (terminalFail) {
    steps.push({
      key: String(currentStatus),
      label: statusLabel(currentStatus),
      date: formatDate(res.updates?.at(-1)?.created_at),
      done: false,
      current: true,
    });
  }

  return {
    orderId: sanitizeAuthText(orderId, 40),
    statusLabel: statusLabel(currentStatus),
    statusTone: statusTone(currentStatus),
    estimatedNote:
      currentStatus === "delivered"
        ? "Delivered"
        : terminalFail
          ? statusLabel(currentStatus)
          : "Status updates as your order progresses",
    steps,
  };
}

/** Parse user-entered order id into numeric API id when possible */
export function parseTrackableOrderId(raw: string): number | null {
  const cleaned = sanitizeAuthText(raw, 40).replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
