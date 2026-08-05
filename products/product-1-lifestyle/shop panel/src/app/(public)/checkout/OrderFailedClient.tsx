"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { useOrderById } from "@/hooks/useOrderById";
import {
  OrderResultSkeleton,
  OrderResultError,
  OrderFailedContent,
  OrderSummaryPanel,
} from "@/components/checkout-result";
import type { CheckoutFailedData } from "@/types/checkout-result";
import type { OrderDetail, OrderItem as ApiOrderItem } from "@/lib/api/order/service";

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

const mapOrderToFailedData = (
  order: OrderDetail,
  orderId: string,
): CheckoutFailedData => ({
  orderId: order.order.id ?? 0,
  title: "Payment Failed",
  message:
    "We're sorry, but there was a problem processing your payment. Our team has been notified.",
  confirmationEmail: order.order.customer_email ?? "",
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
        originalPrice: item.selling_price ?? undefined,
        oldPrice:
          item.selling_price > item.final_unit_price
            ? item.selling_price
            : undefined,
      }))
    : [],
  totals: {
    subtotal: order.totals.subtotal ?? 0,
    delivery: order.totals.delivery_charge ?? 0,
    discount: order.totals.discount_total ?? 0,
    total: order.totals.grand_total ?? 0,
  },
  trackOrderHref: "/orders",
  continueShoppingHref: "/",
});

/* ── Component ───────────────────────────────────────────────────────── */

export default function OrderFailedClient() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") ?? "";
  const numericOrderId = useMemo(() => parseOrderId(orderId), [orderId]);

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const failedData = useMemo<CheckoutFailedData | null>(
    () => (order ? mapOrderToFailedData(order, orderId) : null),
    [order, orderId],
  );

  /* ── Loading ─────────────────────────────────────────────────── */
  if (isLoading) return <OrderResultSkeleton />;

  /* ── Error / missing data ────────────────────────────────────── */
  if (error || !order || !failedData) {
    return (
      <OrderResultError
        orderId={orderId}
        errorMessage={error?.message}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  /* ── Failed with full data ───────────────────────────────────── */
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <OrderFailedContent data={failedData} />
        <OrderSummaryPanel
          meta={failedData.meta}
          items={failedData.items}
          totals={failedData.totals}
        />
      </div>
    </section>
  );
}
