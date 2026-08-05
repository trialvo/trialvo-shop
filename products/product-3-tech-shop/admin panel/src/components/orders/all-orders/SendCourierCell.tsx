import React, { useMemo, useState } from "react";
import type { CourierProviderId, OrderRow } from "./types";
import CourierRequestModal from "@/components/ui/modal/CourierRequestModal";
import { cn } from "@/lib/utils";

type Props = {
  order: OrderRow;

  /**
   * Optional local override coming from OrdersTable (optimistic UI)
   */
  courierOverride?: {
    providerId?: CourierProviderId;
    memoNo?: string;
  };

  /**
   * Optional callbacks (OrdersTable can store override)
   */
  onUpdateCourier?: (
    orderId: string,
    providerId: CourierProviderId,
    memoNo: string
  ) => void;
  onRequestCourier?: (
    orderId: string,
    providerId: Exclude<CourierProviderId, "select">
  ) => Promise<void> | void;
};

type CourierProviderIdSafe = CourierProviderId | "manual" | "unknown";

function providerLabel(id?: CourierProviderIdSafe) {
  switch (id) {
    case "sa_paribahan":
      return "S A Paribahan";
    case "pathao":
      return "Pathao";
    case "redx":
      return "RedX";
    case "delivery_tiger":
      return "Delivery Tiger";
    case "sundarban":
      return "Sundarban Courier";
    case "steadfast":
      return "Steadfast";
    case "paperfly":
      return "Paperfly";
    case "manual":
      return "Manual";
    case "select":
      return "Select Courier";
    default:
      return "Select Courier";
  }
}

export default function SendCourierCell({
  order,
  courierOverride,
  onUpdateCourier,
  onRequestCourier,
}: Props) {
  const [open, setOpen] = useState(false);

  const apiConfigured = Boolean(order.courier?.apiConfigured);
  const connectedAutoProviders =
    order.courier?.availableAutoCouriers?.filter((x) => x.connected) ?? [];
  const hasAnyAuto = apiConfigured && connectedAutoProviders.length > 0;

  const providerIdFromOrder =
    (order.courier?.providerId as CourierProviderIdSafe) ?? "select";
  const memoNoFromOrder = order.courier?.memoNo ?? "";
  const trackingNo = order.courier?.trackingNo ?? "";

  // ✅ effective values (override first)
  const providerId: CourierProviderIdSafe =
    (courierOverride?.providerId as CourierProviderIdSafe) ??
    providerIdFromOrder;

  const memoNo = courierOverride?.memoNo ?? memoNoFromOrder;

  const label = useMemo(() => {
    const byName = (order.courier?.providerName || "").trim();
    if (byName) return byName;
    return providerLabel(providerId);
  }, [providerId, order.courier?.providerName]);

  const pill = useMemo(() => {
    if (trackingNo) {
      return {
        text: "Tracking",
        cls: "bg-success-50 text-success-700 ring-success-200 dark:bg-success-500/10 dark:text-success-200 dark:ring-success-500/30",
      };
    }
    if (hasAnyAuto) {
      return null;
    }
    // if (hasAnyAuto) {
    //   return {
    //     text: "Auto",
    //     cls: "bg-brand-500/10 text-brand-600 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-500/25",
    //   };
    // }
    if (providerId !== "select" || memoNo) {
      return {
        text: "Manual",
        cls: "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10",
      };
    }
    return {
      text: "Not Set",
      cls: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/30",
    };
  }, [trackingNo, hasAnyAuto, providerId, memoNo]);

  const actionLabel = useMemo(() => {
    if (trackingNo) return "VIEW";
    if (hasAnyAuto) return "REQUEST";
    if (memoNo || providerId !== "select") return "EDIT";
    return "SEND";
  }, [trackingNo, hasAnyAuto, memoNo, providerId]);

  const secondaryLine = trackingNo
    ? `Tracking: ${trackingNo}`
    : memoNo
    ? `Memo: ${memoNo}`
    : "Not set";

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {label}
            </p>

            {pill && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                  pill.cls
                )}
                title={hasAnyAuto ? "Courier API available" : "Manual courier"}
              >
                {pill.text}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {secondaryLine}
          </p>

          {/* {hasAnyAuto ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Auto available:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {connectedAutoProviders
                  .map((x) => x.providerName)
                  .reduce((acc, s) => (acc ? `${acc}, ${s}` : s), "")}
              </span>
            </p>
          ) : null} */}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white",
            hasAnyAuto
              ? "bg-success-600 hover:bg-success-700"
              : "bg-brand-500 hover:bg-brand-600"
          )}
        >
          {actionLabel}
        </button>
      </div>

      {/* ✅ keep same modal, just pass order (your existing modal expects this) */}
      <CourierRequestModal
        open={open}
        onClose={() => setOpen(false)}
        order={order}
        // If later your modal supports callbacks, you can wire these:
        // onUpdateCourier={(providerId, memoNo) => onUpdateCourier?.(String(order.id), providerId, memoNo)}
        // onRequestCourier={(providerId) => onRequestCourier?.(String(order.id), providerId)}
      />
    </>
  );
}
