"use client";

import React from "react";
import { CheckCircle2, Circle, Clock, Package, Truck, XCircle } from "lucide-react";
import type { OrderStatusHistory, OrderStatus } from "@/lib/api/order/service";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";

type Props = {
  history: OrderStatusHistory[];
  currentStatus: OrderStatus;
};

function sortHistory(history: OrderStatusHistory[]) {
  return [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function getStatusLabel(status: OrderStatus | null): string {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function OrderTrackingTimeline({ history, currentStatus }: Props) {
  const { t } = useTranslation();
  const sorted = sortHistory(history);

  if (!sorted.length) return null;

  return (
    <div className="bg-white p-6 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-4">
        {t("account.orders.trackingHistory") || "Tracking Timeline"}
      </h2>
      
      <div className="relative pl-4">
        <div className="absolute left-[1.6rem] top-4 bottom-4 w-0.5 bg-gray-200" />
        
        <div className="space-y-8">
          {sorted.map((item, index) => {
            const isFirst = index === 0;
            const isCancelled = item.new_status === "cancelled";

            let Icon = CheckCircle2;
            let iconColor = isFirst ? "text-brand-500 bg-brand-50" : "text-gray-400 bg-white";
            
            if (isCancelled) {
              Icon = XCircle;
              iconColor = "text-red-500 bg-red-50";
            } else if (item.new_status === "shipped" || item.new_status === "out_for_delivery") {
              Icon = Truck;
            } else if (item.new_status === "packaging" || item.new_status === "processing") {
              Icon = Package;
            } else if (item.new_status === "new" || item.new_status === "on_hold") {
              Icon = Clock;
            }

            const adminName = item.admin_first_name
              ? `${item.admin_first_name} ${item.admin_last_name || ""}`.trim()
              : null;

            return (
              <div key={item.id ?? index} className="relative flex items-start gap-6">
                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${isFirst ? "border-brand-500" : "border-gray-200"} ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex flex-col pt-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${isFirst ? "text-gray-900" : "text-gray-600"}`}>
                      {getStatusLabel(item.new_status)}
                    </h3>
                    {item.old_status && (
                      <span className="text-xs text-gray-400">
                        ← {getStatusLabel(item.old_status)}
                      </span>
                    )}
                  </div>
                  
                  {item.note && (
                    <p className="mt-1 text-sm text-gray-500 max-w-sm">
                      {item.note}
                    </p>
                  )}
                  
                  <div className="mt-2 text-xs font-semibold text-gray-400">
                    {format(new Date(item.created_at), "MMM d, yyyy • h:mm a")}
                    {adminName && <span className="ml-1 opacity-75">by {adminName}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
