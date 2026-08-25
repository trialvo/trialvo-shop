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
        "grid grid-cols-[1.15fr_0.9fr_1fr_0.95fr] items-center gap-4",
        "border-b border-[#E5E5E5] bg-white px-4 py-3.5",
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-sm" />
        <Skeleton className="h-3 w-32 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-20 rounded-sm" />
        <Skeleton className="h-3 w-16 rounded-sm" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-sm" />
        <Skeleton className="h-3 w-20 rounded-sm" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
};

const OrderRow: React.FC<Props> = ({
  item,
  onMakePayment,
  onViewDetails,
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
    if (
      ["new", "approved", "processing", "shipped", "delivered", "cancelled", "trash"].includes(
        status,
      )
    ) {
      return status as OrderStatus;
    }
    return "new" as OrderStatus;
  }, [item.order_status]);

  return (
    <div
      className={cn(
        "grid grid-cols-[1.15fr_0.9fr_1fr_0.95fr] items-center gap-4",
        "border-b border-[#E5E5E5] bg-white px-4 py-3.5 last:border-b-0",
        "transition-colors duration-200 ease-out hover:bg-black/[0.015]",
      )}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium text-black">{orderIdLabel}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-black/45">Placed On</span>
          <span className="text-xs text-black/75">{formattedDate}</span>
        </div>
      </div>

      <div className="space-y-1">
        <OrderStatusPill status={orderStatus} />
        <div className="text-xs text-black/45">{paymentLine(item)}</div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-medium text-black">{formattedTotal}</div>
        <div className="text-xs text-black/45">
          Qty{" "}
          <span className="font-medium text-black/80">{pad2(totalQty)} Pcs.</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {showMakePayment && (
          <Button
            type="button"
            className={cn(
              "h-8 rounded-md bg-black px-3 text-xs font-medium text-white",
              "transition-colors duration-200 ease-out hover:bg-black/85",
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
                "grid h-8 w-8 cursor-pointer place-items-center rounded-md text-black/45",
                "transition-[color,background-color] duration-200 ease-out",
                "hover:bg-black/[0.04] hover:text-black",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15",
              )}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 rounded-md border border-[#E5E5E5] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <DropdownMenuItem
              onClick={() => onViewDetails?.(item.id.toString())}
              className="cursor-pointer rounded-sm text-sm"
            >
              View Details
            </DropdownMenuItem>

            {showMakePayment ? (
              <DropdownMenuItem
                onClick={() => onCancel?.(item.id.toString())}
                className="cursor-pointer rounded-sm text-sm text-red-600 focus:text-red-600"
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
