"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOrder } from "@/hooks/useOrder";
import { usePaymentSubmit } from "@/hooks/usePaymentSubmit";
import {
  orderStatusBadgeClass,
  type AccountOrderRowViewModel,
} from "@/lib/adapters/accountOrder";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type OrderListItemCardProps = Readonly<{
  order: AccountOrderRowViewModel;
}>;

/**
 * Single order row — keeps existing account card chrome
 * (rounded-sm, border-border) with clearer actions.
 */
export function OrderListItemCard({
  order,
}: OrderListItemCardProps): ReactElement {
  const { cancelOrder } = useOrder();
  const { submitPayment, isLoading: paying } = usePaymentSubmit();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrder.mutateAsync({ orderId: order.id });
      toast.success("Order cancelled");
      setConfirmOpen(false);
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(err, "Could not cancel this order."),
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-sm border border-border hover:bg-secondary/30 transition-colors">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Order {order.orderIdLabel}</p>
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize",
                orderStatusBadgeClass(order.status),
              )}
            >
              {order.statusLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {order.placedAtLabel}
            {order.itemCount > 0 ? ` · ${order.itemCount} item(s)` : ""}
            {" · "}
            {order.paymentTypeLabel}
            {" · "}
            <span className="capitalize">{order.paymentStatusLabel}</span>
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <p className="text-sm font-semibold">{order.totalLabel}</p>
          <div className="flex flex-wrap gap-2">
            {order.canPay ? (
              <AppButton
                type="button"
                size="sm"
                variant="outline"
                className="text-xs h-8"
                isLoading={paying}
                loadingText="Pay…"
                onClick={() => void submitPayment(order.id, "sslcommerz")}
              >
                Pay now
              </AppButton>
            ) : null}
            {order.canTrack ? (
              <AppButton asChild size="sm" variant="ghost" className="text-xs h-8">
                <Link href={`/order-tracking?orderId=${order.id}`}>Track</Link>
              </AppButton>
            ) : null}
            {order.canCancel ? (
              <AppButton
                type="button"
                size="sm"
                variant="ghost"
                className="text-xs h-8 text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                Cancel
              </AppButton>
            ) : null}
          </div>
        </div>
      </article>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {order.orderIdLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If you change your mind, you will need to
              place a new order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm" disabled={cancelling}>
              Not now
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
