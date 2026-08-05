"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreVertical } from "lucide-react";
import React from "react";
import OrderStatusPill from "./OrderStatusPill";
import type { MyOrderItem, OrderStatus } from "./types";

type Props = {
  item: MyOrderItem;
  onMakePayment?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onTrack?: (id: string) => void;
  onCancel?: (id: string) => void;
  isEvenRow?: boolean;
};

const money = (n: number): string =>
  `BDT ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pad2 = (n: number): string => String(n).padStart(2, "0");

function safeDateLabel(iso?: string): string {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "dd/MM/yyyy");
  } catch {
    return "Invalid date";
  }
}

export function paymentLine(item: MyOrderItem): string {
  if (item.payment_status === "paid") return "Paid";
  if (item.due_amount && item.due_amount > 0) return "Due";
  return "Cash On Delivery";
}

export const OrderRowSkeleton: React.FC = () => {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_0.9fr_0.9fr_0.8fr] items-center",
        "px-2 py-4",
        "bg-white",
        "border-b border-[#E6E6E6]",
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-sm" />
        <Skeleton className="h-3 w-32 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-sm" />
        <Skeleton className="h-3 w-20 rounded-sm" />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Skeleton className="h-9 w-28 rounded-none" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
};

const OrderRow: React.FC<Props> = ({
  item,
  onMakePayment,
  onViewDetails,
  onTrack,
  isEvenRow,
  onCancel,
}) => {
  const totalQty = React.useMemo(() => {
    if (!item.items || !Array.isArray(item.items)) return 0;
    return item.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  }, [item.items]);

  const formattedDate = React.useMemo(() => safeDateLabel(item.created_at), [item.created_at]);

  const showMakePayment = React.useMemo(() => {
    return item.order_status === "new" && item.payment_status === "unpaid";
  }, [item.order_status, item.payment_status]);

  const formattedTotal = React.useMemo(() => {
    const amount = item.grand_total || 0;
    return money(Math.abs(amount));
  }, [item.grand_total]);

  const orderIdLabel = React.useMemo(() => {
    const raw = item.id?.toString?.() ?? "";
    return raw ? raw : "—";
  }, [item.id]);

  const orderStatus = React.useMemo(() => {
    const status = item.order_status?.toLowerCase() || "new";
    if (['new', 'approved', 'processing', 'shipped', 'delivered', 'cancelled', 'trash'].includes(status)) {
      return status as OrderStatus;
    }
    return "new" as OrderStatus;
  }, [item.order_status]);

  return (
    <div
      className={cn(
        "grid grid-cols-[1.15fr_0.9fr_1fr_0.95fr] items-center",
        "px-2 py-4",
        "bg-white",
        "border-b border-[#E6E6E6]",
      )}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium text-black">{orderIdLabel}</div>

        <div className="flex items-baseline gap-2">
          <span className="text-xs text-[#9A9A9A]">Placed On</span>
          <span className="text-xs text-black">{formattedDate}</span>
        </div>
      </div>

      <div className="space-y-1">
        <OrderStatusPill status={orderStatus} />
        <div className="text-xs font-normal text-[#999999]">{paymentLine(item)}</div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-black">{formattedTotal}</div>

        <div className="text-xs text-[#999999]">
          Qty{" "}
          <span className="font-medium text-black">{pad2(totalQty)}
            Pcs.
          </span>{" "}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {showMakePayment && (
          <Button
            type="button"
            className={cn(
              " rounded-none bg-black px-3 py-1.25",
              "text-xs font-medium text-white",
              "hover:bg-black/90",
            )}
            onClick={() => onMakePayment?.(item.id.toString())}
          >
            Make Payment
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Actions"
              className={cn(
                "grid h-11 w-11 place-items-center cursor-pointer",
                "text-[#6B6B6B]",
                "hover:text-black",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20",
              )}
            >
              <MoreVertical className="h-6 w-6" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)]">
            <DropdownMenuItem
              onClick={() => onViewDetails?.(item.id.toString())}
              className="cursor-pointer text-sm"
            >
              View Details
            </DropdownMenuItem>

            {showMakePayment ? (
              <DropdownMenuItem
                onClick={() => onCancel?.(item.id.toString())}
                className="cursor-pointer text-sm text-red-600 focus:text-red-600"
              >
                Cancel Order
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default OrderRow;
