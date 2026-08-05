"use client";

import Link from "next/link";
import { useMemo, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import { AppButton } from "@/components/shared/AppButton";
import {
  CheckoutResultSkeleton,
  CheckoutResultSummary,
} from "@/components/checkout/result/CheckoutResultSummary";
import { CheckoutOrderSuccessPanel } from "@/components/checkout/result/CheckoutOrderSuccessPanel";
import { useAuthContext } from "@/context/AuthContext";
import { useOrder } from "@/hooks/useOrder";
import {
  normalizePaymentCallbackStatus,
  parseCheckoutOrderId,
  toCheckoutResultViewModel,
} from "@/lib/adapters/checkoutOrderResult";
import { sanitizeAuthText } from "@/lib/security/auth";
import { readLastCheckoutOrder } from "@/lib/checkout/lastCheckoutOrder";

const resultCardClass =
  "sm:mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] bg-white p-4 sm:p-6";

/**
 * Graduate OrderSuccessClient — SSLCommerz callback + COD confirmation.
 */
export function CheckoutSuccessClient(): ReactElement {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthContext();
  const { useOrderById } = useOrder();

  const orderIdRaw =
    searchParams.get("orderId")?.trim() ||
    readLastCheckoutOrder()?.orderId ||
    "";
  const paymentParam = searchParams.get("payment")?.trim() ?? "";
  const paymentNorm = normalizePaymentCallbackStatus(paymentParam);
  const isPaymentFailed =
    paymentNorm === "failed" || paymentNorm === "cancel";

  const numericId = parseCheckoutOrderId(orderIdRaw) ?? 0;
  const { data: order, isLoading, error } = useOrderById(
    isAuthenticated ? numericId : 0,
  );

  const view = useMemo(
    () => (order ? toCheckoutResultViewModel(order, orderIdRaw) : null),
    [order, orderIdRaw],
  );

  const displayOrderId = sanitizeAuthText(
    view?.orderId || orderIdRaw,
    40,
  );

  if (isPaymentFailed) {
    const isFailed = paymentNorm === "failed";
    return (
      <>
      <div className={resultCardClass}>
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-700">
              {isFailed ? "Payment Failed" : "Payment Cancelled"}
            </h2>
            {displayOrderId ? (
              <p className="text-gray-600">
                Order <strong>#{displayOrderId}</strong>
              </p>
            ) : null}
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {isFailed
                ? "Your payment could not be processed. Please try again or contact support."
                : "Your payment was cancelled. Your order may still be saved — you can retry payment."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <AppButton
                asChild
                variant="outline"
                className="h-9 rounded-none border-[#A9A9A9]"
              >
                <Link
                  href={`/checkout/failed?status=${encodeURIComponent(paymentNorm)}&orderId=${encodeURIComponent(displayOrderId)}`}
                >
                  Try payment again
                </Link>
              </AppButton>
              <AppButton
                asChild
                className="h-9 rounded-none bg-black text-white hover:bg-black/90"
              >
                <Link href="/shop">Continue shopping</Link>
              </AppButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isAuthenticated && numericId > 0 && isLoading) {
    return <CheckoutResultSkeleton />;
  }

  if (view) {
    return (
      <>
      <div className={resultCardClass}>
          <div className="flex flex-col sm:gap-12 justify-between sm:flex-row">
            <div className="flex-1 min-w-0">
              <CheckoutOrderSuccessPanel
                data={view}
                showTrackOrder={isAuthenticated}
              />
            </div>
            <div className="w-full sm:w-[420px] sm:shrink-0 mt-6 sm:mt-0">
              <CheckoutResultSummary data={view} showDelivery={false} />
            </div>
          </div>
        </div>

        {/* Mobile sticky CTAs */}
        <div className="fixed z-20 inset-x-0 bottom-0 border-t border-black/10 bg-white p-4 shadow-[0_-6px_18px_rgba(0,0,0,0.08)] sm:hidden">
          <div className="mx-auto flex w-full max-w-lg flex-row gap-3">
            {isAuthenticated ? (
              <Link
                href={view.trackOrderHref}
                className="flex h-11 w-full items-center justify-center border border-black/30 text-sm font-semibold text-black"
              >
                Track order
              </Link>
            ) : null}
            <Link
              href={view.continueShoppingHref}
              className="flex h-11 w-full items-center justify-center bg-black text-sm font-semibold text-white"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (paymentNorm === "success" && displayOrderId) {
    return (
      <>
      <div className={resultCardClass}>
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-700">
              Payment Successful!
            </h2>
            <p className="text-gray-600">
              Order <strong>#{displayOrderId}</strong>
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your payment has been processed successfully. We will contact you
              shortly to confirm delivery.
            </p>
            <AppButton
              asChild
              className="h-9 rounded-none bg-black text-white hover:bg-black/90"
            >
              <Link href="/shop">Continue shopping</Link>
            </AppButton>
          </div>
        </div>
      </>
    );
  }

  if (displayOrderId) {
    return (
      <>
      <div className={resultCardClass}>
          <div className="text-center py-12 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl text-green-700" aria-hidden>
                ✓
              </span>
            </div>
            <h2 className="text-xl font-bold text-black">Order placed!</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Thank you for your order. We will contact you shortly to confirm
              delivery. Order ID: <strong>#{displayOrderId}</strong>
            </p>
            {error && isAuthenticated ? (
              <p className="text-xs text-gray-400">
                Order details could not be loaded right now.
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AppButton
                asChild
                className="h-9 rounded-none bg-black text-white hover:bg-black/90"
              >
                <Link href="/shop">Continue shopping</Link>
              </AppButton>
              <AppButton
                asChild
                variant="outline"
                className="h-9 rounded-none border-[#A9A9A9]"
              >
                <Link href="/order-tracking">Track order</Link>
              </AppButton>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={resultCardClass}>
        <div className="text-center py-12 space-y-4">
          <h1 className="text-lg font-medium text-red-600">
            Unable to load order details
          </h1>
          <p className="text-sm text-gray-600">
            {error?.message || "Order not found or invalid order ID"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <AppButton
                asChild
                className="h-9 rounded-none bg-black text-white hover:bg-black/90"
              >
                <Link href="/account?tab=orders">View all orders</Link>
              </AppButton>
            ) : null}
            <AppButton
              asChild
              variant="outline"
              className="h-9 rounded-none border-[#A9A9A9]"
            >
              <Link href="/shop">Continue shopping</Link>
            </AppButton>
          </div>
        </div>
      </div>
    </>
  );
}

export default CheckoutSuccessClient;
