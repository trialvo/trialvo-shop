"use client";

import Link from "next/link";
import { useMemo, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import { AppButton } from "@/components/shared/AppButton";
import {
  CheckoutResultSkeleton,
  CheckoutResultSummary,
} from "@/components/checkout/result/CheckoutResultSummary";
import { CheckoutOrderFailedPanel } from "@/components/checkout/result/CheckoutOrderFailedPanel";
import { useAuthContext } from "@/context/AuthContext";
import { useOrder } from "@/hooks/useOrder";
import {
  normalizePaymentCallbackStatus,
  parseCheckoutOrderId,
  toCheckoutResultViewModel,
} from "@/lib/adapters/checkoutOrderResult";
import { sanitizeAuthText } from "@/lib/security/auth";

const resultCardClass =
  "mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] bg-white p-4 sm:p-6";

/**
 * Graduate OrderFailedClient layout + SSLCommerz retry.
 */
export function CheckoutFailedClient(): ReactElement {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthContext();
  const { useOrderById } = useOrder();

  const orderIdRaw = searchParams.get("orderId")?.trim() ?? "";
  const statusRaw =
    searchParams.get("status") ?? searchParams.get("reason") ?? "";
  const normalized = normalizePaymentCallbackStatus(statusRaw);
  const isCancel =
    normalized === "cancel" ||
    statusRaw.toLowerCase() === "cancelled" ||
    statusRaw.toLowerCase() === "canceled";

  const numericId = parseCheckoutOrderId(orderIdRaw) ?? 0;
  const safeOrderId = sanitizeAuthText(orderIdRaw, 40);

  const { data: order, isLoading, error } = useOrderById(
    isAuthenticated ? numericId : 0,
  );

  const view = useMemo(
    () => (order ? toCheckoutResultViewModel(order, orderIdRaw) : null),
    [order, orderIdRaw],
  );

  const title = isCancel ? "Payment cancelled!" : "Payment failed!";
  const message = isCancel
    ? "Your payment was cancelled. Your order is still saved — you can retry payment."
    : "We're sorry, but there was a problem processing your payment. Our team has been notified.";

  if (isAuthenticated && numericId > 0 && isLoading) {
    return <CheckoutResultSkeleton />;
  }

  if (view) {
    return (
      <>
      <div className={resultCardClass}>
          <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-12">
            <div className="flex-1 min-w-0">
              <CheckoutOrderFailedPanel
                data={view}
                title={title}
                message={message}
                canRetryPayment={isAuthenticated}
              />
            </div>
            <div className="w-full sm:w-[420px] sm:min-w-[420px]">
              <CheckoutResultSummary data={view} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={resultCardClass}>
        {error && isAuthenticated ? (
          <div className="text-center py-8 space-y-3 mb-4">
            <p className="text-lg font-medium text-red-600">
              Unable to load order details
            </p>
            <p className="text-sm text-gray-600">
              {error.message || "Order not found or invalid order ID"}
            </p>
            <p className="text-xs text-gray-500">
              Order ID: {safeOrderId || "Not provided"}
            </p>
          </div>
        ) : null}
        <CheckoutOrderFailedPanel
          data={{
            numericOrderId: numericId,
            orderId: safeOrderId,
            supportEmail: "support@shoplinkbd.com",
            continueShoppingHref: "/shop",
          }}
          title={title}
          message={message}
          canRetryPayment={isAuthenticated && numericId > 0}
        />
        {isAuthenticated ? (
          <div className="mt-6">
            <AppButton
              asChild
              variant="outline"
              className="h-9 rounded-none border-[#A9A9A9]"
            >
              <Link href="/account?tab=orders">View All Orders</Link>
            </AppButton>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default CheckoutFailedClient;
