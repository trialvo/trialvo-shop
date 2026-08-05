"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useOrderById } from "@/hooks/useOrderById";
import {
  OrderResultSkeleton,
  OrderResultError,
  OrderSuccessContent,
  OrderSummaryPanel,
} from "@/components/checkout-result";
import type { CheckoutSuccessData } from "@/types/checkout-result";
import type { OrderDetail, OrderItem as ApiOrderItem } from "@/lib/api/order/service";
import { mapOrderToInvoice } from "@/lib/invoice/invoice-utils";

/* ── Helpers ─────────────────────────────────────────────────────────── */

const parseOrderId = (raw: string): number => {
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : 0;
};

const getPaymentMethodDisplay = (paymentType: string): string => {
  switch (paymentType) {
    case "cod":
      return "Cash on Delivery";
    case "gateway":
      return "Online Payment";
    case "mixed":
      return "Mixed Payment";
    default:
      return paymentType
        ? paymentType.charAt(0).toUpperCase() + paymentType.slice(1)
        : "N/A";
  }
};

const mapOrderToSuccessData = (
  order: OrderDetail,
  orderId: string,
): CheckoutSuccessData => ({
  orderId: String(order.order.id ?? orderId),
  confirmationEmail: order.order.customer_email ?? "",
  customerName: order.order.customer_name ?? "Customer",
  customerPhone: order.order.customer_phone ?? "",
  deliveryAddress: {
    name: order.order.customer_name ?? "Customer",
    address: order.order.address?.full_address ?? "Address not provided",
    mobile: order.order.customer_phone ?? "N/A",
    email: order.order.customer_email ?? "N/A",
  },
  meta: {
    date: order.order.created_at
      ? new Date(order.order.created_at).toLocaleDateString("en-GB")
      : "N/A",
    orderId: String(order.order.id ?? orderId),
    paymentMethod: getPaymentMethodDisplay(order.order.payment_type),
  },
  items: Array.isArray(order.items)
    ? order.items.map((item: ApiOrderItem) => ({
        id: String(item.id),
        title: item.product_name ?? "Product",
        image: item.product_image ?? "/placeholder-product.jpg",
        quantity: item.quantity ?? 0,
        price: item.final_unit_price ?? item.selling_price ?? 0,
        originalPrice: item.selling_price ?? 0,
        oldPrice:
          item.selling_price > item.final_unit_price
            ? item.selling_price
            : 0,
      }))
    : [],
  totals: {
    subtotal: order.totals.subtotal ?? 0,
    delivery: order.totals.delivery_charge ?? 0,
    discount: order.totals.sku_discount_total ?? 0,
    couponDiscount: order.totals.coupon_discount ?? 0,
    weightKg: order.totals.weight_kg_total ?? 0,
    weightSurcharge: order.totals.weight_extra_charge ?? 0,
    bulkDiscount: order.totals.bulk_discount_total ?? 0,
    comboDiscount: order.totals.combo_discount_total ?? 0,
    cartWideDiscount: order.totals.cart_wide_discount ?? 0,
    total: order.totals.grand_total ?? 0,
  },
  trackOrderHref: "/orders",
  continueShoppingHref: "/",
});

/* ── Component ───────────────────────────────────────────────────────── */

export default function OrderSuccessClient() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") ?? "";
  const numericOrderId = useMemo(() => parseOrderId(orderId), [orderId]);
  const paymentStatus = searchParams.get("payment") ?? "";

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const successData = useMemo<CheckoutSuccessData | null>(
    () => (order ? mapOrderToSuccessData(order, orderId) : null),
    [order, orderId],
  );

  const invoiceData = useMemo(
    () => (order ? mapOrderToInvoice(order) : null),
    [order],
  );

  /* ── Loading ─────────────────────────────────────────────────── */
  if (isLoading) return <OrderResultSkeleton />;

  /* ── Payment failed/cancelled from gateway callback ──────────── */
  const isPaymentFailed =
    paymentStatus === "failed" || paymentStatus === "cancelled";

  if (isPaymentFailed) {
    const isFailed = paymentStatus === "failed";

    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <XCircle size={24} className="text-destructive" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            {isFailed ? "Payment Failed" : "Payment Cancelled"}
          </h2>
          {orderId && (
            <p className="text-sm text-muted-foreground mb-1">
              Order <span className="font-medium text-foreground">#{orderId}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mb-8">
            {isFailed
              ? "Your payment could not be processed. Please try again or contact support."
              : "Your payment was cancelled. Your order is still saved — you can retry payment."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated && (
              <Link
                href="/orders"
                className="h-10 px-5 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center"
              >
                View All Orders
              </Link>
            )}
            <Link
              href="/"
              className="h-10 px-5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium transition-colors rounded-xl flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  /* ── Unauth user with payment=success but no order data ──────── */
  if ((error || !order || !successData) && paymentStatus === "success" && orderId) {
    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={24} className="text-success" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            Payment Successful!
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            Order <span className="font-medium text-foreground">#{orderId}</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8">
            Your payment has been processed. We will contact you shortly to confirm delivery.
          </p>
          <Link
            href="/"
            className="h-10 px-5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium transition-colors rounded-xl inline-flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  /* ── Error / missing data ────────────────────────────────────── */
  if (error || !order || !successData) {
    return (
      <OrderResultError
        orderId={orderId}
        errorMessage={error?.message}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  /* ── Success with full data ──────────────────────────────────── */
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <OrderSuccessContent data={successData} showTrackOrder={isAuthenticated} invoiceData={invoiceData} />
        <OrderSummaryPanel
          meta={successData.meta}
          items={successData.items}
          totals={successData.totals}
        />
      </div>
    </section>
  );
}
