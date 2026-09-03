"use client";

import type { OrderStatus, OrderStatusHistory } from "@/lib/api/order/service";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import React from "react";

type Props = {
  history: OrderStatusHistory[];
  currentStatus: OrderStatus;
};

function sortHistory(history: OrderStatusHistory[]) {
  return [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function getStatusLabel(status: OrderStatus | null): string {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrderTrackingTimeline({ history }: Props) {
  const { t } = useTranslation();
  const sorted = sortHistory(history);

  if (!sorted.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
          {t("account.orders.trackingHistory")}
        </p>
      </div>

      <div className="relative px-4 py-5 min-[768px]:px-5">
        <div className="absolute bottom-8 left-[2.15rem] top-8 w-px bg-black/8 min-[768px]:left-[2.4rem]" />

        <div className="space-y-6">
          {sorted.map((item, index) => {
            const isFirst = index === 0;
            const isCancelled = item.new_status === "cancelled";

            let Icon = CheckCircle2;
            if (isCancelled) Icon = XCircle;
            else if (
              item.new_status === "shipped" ||
              item.new_status === "out_for_delivery"
            ) {
              Icon = Truck;
            } else if (
              item.new_status === "packaging" ||
              item.new_status === "processing"
            ) {
              Icon = Package;
            } else if (item.new_status === "new" || item.new_status === "on_hold") {
              Icon = Clock;
            }

            const adminName = item.admin_first_name
              ? `${item.admin_first_name} ${item.admin_last_name || ""}`.trim()
              : null;

            return (
              <div key={item.id ?? index} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border",
                    isCancelled
                      ? "border-[#F5B5B5] bg-[#FDECEC] text-[#C62828]"
                      : isFirst
                        ? "border-black/15 bg-[#F3F1ED] text-[#191919]"
                        : "border-black/10 bg-white text-[#8A8A8A]",
                  )}
                >
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "text-sm font-semibold",
                        isFirst ? "text-[#191919]" : "text-[#5F5F5F]",
                      )}
                    >
                      {getStatusLabel(item.new_status)}
                    </h3>
                    {item.old_status ? (
                      <span className="text-[11px] text-[#8A8A8A]">
                        from {getStatusLabel(item.old_status)}
                      </span>
                    ) : null}
                  </div>

                  {item.note ? (
                    <p className="mt-1 max-w-lg text-sm leading-relaxed text-[#5F5F5F]">
                      {item.note}
                    </p>
                  ) : null}

                  <p className="mt-1.5 text-[11px] font-medium text-[#8A8A8A]">
                    {format(new Date(item.created_at), "MMM d, yyyy • h:mm a")}
                    {adminName ? (
                      <span className="ml-1 opacity-80">· {adminName}</span>
                    ) : null}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
