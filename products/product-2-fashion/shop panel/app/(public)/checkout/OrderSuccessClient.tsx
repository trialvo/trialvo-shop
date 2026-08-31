"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import OrderSuccess from "@/components/order-success/OrderSuccess";
import { OrderSuccessData } from "@/components/order-summary/order.types";
import OrderSummaryPanel from "@/components/order-summary/OrderSummaryPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useOrder } from "@/hooks/useOrder";
import { useTranslation } from "@/hooks/useTranslation";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import type { OrderDetail, OrderItem as ApiOrderItem } from "@/lib/api/order/service";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { FiCheck, FiX } from "react-icons/fi";

const OrderSuccessClient: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { useOrderById } = useOrder();
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const numericOrderId = React.useMemo(() => {
    const id = parseInt(orderId, 10);
    return Number.isNaN(id) ? 0 : id;
  }, [orderId]);

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const successData = React.useMemo((): OrderSuccessData | null => {
    if (!order) return null;

    const orderDetail: OrderDetail = order;

    const getPaymentMethodDisplay = (paymentType: string): string => {
      switch (paymentType) {
        case "cod":
          return "Cash on Delivery";
        case "gateway":
          return "Online Payment";
        case "mixed":
          return "Mixed Payment";
        default:
          return paymentType?.charAt(0).toUpperCase() + paymentType?.slice(1);
      }
    };

    return {
      confirmationEmail: orderDetail?.order.customer_email || "",
      deliveryAddress: {
        name: orderDetail?.order.customer_name || "Customer",
        address: orderDetail.order?.address?.full_address || "Address not provided",
        mobile: orderDetail.order.customer_phone || "N/A",
        email: orderDetail.order.customer_email || "N/A",
      },
      meta: {
        date: orderDetail.order.created_at
          ? new Date(orderDetail.order?.created_at).toLocaleDateString("en-GB")
          : "N/A",
        orderId: String(orderDetail.order?.id) || orderId,
        paymentMethod: getPaymentMethodDisplay(orderDetail.order?.payment_type),
      },
      items: Array.isArray(orderDetail.items)
        ? orderDetail.items.map((item: ApiOrderItem) => ({
            id: String(item.id),
            title: item.product_name || "Product",
            image: item.product_image || "/placeholder-product.jpg",
            quantity: item.quantity || 0,
            price: item.final_unit_price || item.selling_price || 0,
            originalPrice: item.selling_price || 0,
            oldPrice: item.selling_price > item.final_unit_price ? item.selling_price : 0,
          }))
        : [],
      totals: {
        subtotal: orderDetail.totals.subtotal || 0,
        delivery: orderDetail.totals.delivery_charge || 0,
        discount: orderDetail.totals.sku_discount_total ?? 0,
        couponDiscount: orderDetail.totals.coupon_discount ?? 0,
        weightKg: orderDetail.totals.weight_kg_total ?? 0,
        weightSurcharge: orderDetail.totals.weight_extra_charge ?? 0,
        bulkDiscount: orderDetail.totals.bulk_discount_total ?? 0,
        comboDiscount: orderDetail.totals.combo_discount_total ?? 0,
        cartWideDiscount: orderDetail.totals.cart_wide_discount ?? 0,
        total: orderDetail.totals.grand_total || 0,
      },
      trackOrderHref: `/account/orders`,
      continueShoppingHref: "/",
    };
  }, [order, orderId]);

  const { trackPurchase } = useAnalytics();
  React.useEffect(() => {
    if (!successData) return;

    try {
      const storageKey = `tracked_order_${successData.meta.orderId}`;
      const hasTracked = localStorage.getItem(storageKey);
      if (hasTracked) return;

      trackPurchase({
        value: successData.totals.total,
        order_id: successData.meta.orderId,
        content_ids: successData.items.map((i) => String(i.id)),
        num_items: successData.items.length,
      });

      localStorage.setItem(storageKey, "true");
    } catch (e) {
      console.warn("Could not access localStorage for tracking order deduplication", e);
    }
  }, [successData, trackPurchase]);

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: t("breadcrumb.home"), href: "/" },
        { label: t("checkout.breadcrumb") },
      ]}
    />
  );

  if (isLoading) {
    return (
      <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
        {crumbs}
        <div className="mt-6 grid grid-cols-1 gap-6 min-[992px]:mt-8 min-[992px]:grid-cols-[minmax(0,1fr)_400px] min-[992px]:gap-10">
          <div className="space-y-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  const paymentStatus = searchParams.get("payment") || "";
  const isPaymentFailed = paymentStatus === "failed" || paymentStatus === "cancelled";

  if (isPaymentFailed) {
    const isFailed = paymentStatus === "failed";
    return (
      <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
        {crumbs}
        <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-2xl border border-black/8 bg-white px-6 py-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F7EAEA] text-[#B42318]">
            <FiX className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-[#191919]">
            {isFailed ? "Payment Failed" : "Payment Cancelled"}
          </h2>
          {orderId ? (
            <p className="mt-2 text-sm text-[#5F5F5F]">
              Order <span className="font-semibold text-[#191919]">#{orderId}</span>
            </p>
          ) : null}
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#8A8A8A]">
            {isFailed
              ? "Your payment could not be processed. Please try again or contact support."
              : "Your payment was cancelled. Your order is still saved — you can retry payment."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/account/orders"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-black/15 px-4 text-[13px] font-semibold text-[#191919] hover:bg-[#FAF8F5]"
              >
                {t("orderSuccess.viewAllOrders")}
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white hover:bg-black"
            >
              {t("orderSuccess.continueShopping")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error || !order || !successData) {
    if (paymentStatus === "success" && orderId) {
      return (
        <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
          {crumbs}
          <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-2xl border border-black/8 bg-white px-6 py-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#191919] text-white">
              <FiCheck className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-[#191919]">
              Payment Successful!
            </h2>
            <p className="mt-2 text-sm text-[#5F5F5F]">
              Order <span className="font-semibold text-[#191919]">#{orderId}</span>
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#8A8A8A]">
              Your payment has been processed successfully. We will contact you shortly to
              confirm delivery.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white hover:bg-black"
            >
              {t("orderSuccess.continueShopping")}
            </Link>
          </div>
        </section>
      );
    }

    return (
      <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
        {crumbs}
        <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-2xl border border-black/8 bg-white px-6 py-10 text-center">
          <h2 className="text-lg font-bold tracking-tight text-[#191919]">
            {t("orderSuccess.unableToLoad")}
          </h2>
          <p className="mt-2 text-sm text-[#5F5F5F]">
            {error?.message || t("orderSuccess.orderNotFound")}
          </p>
          <p className="mt-1 text-xs text-[#8A8A8A]">
            {t("orderSuccess.orderIdLabel")} {orderId || t("orderSuccess.notProvided")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/account/orders"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white hover:bg-black"
              >
                {t("orderSuccess.viewAllOrders")}
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-black/15 px-4 text-[13px] font-semibold text-[#191919] hover:bg-[#FAF8F5]"
            >
              {t("orderSuccess.continueShopping")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-3 pb-28 pt-2 min-[640px]:pb-16 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
      {crumbs}

      <div className="mt-4 grid grid-cols-1 gap-6 min-[992px]:mt-6 min-[992px]:grid-cols-[minmax(0,1fr)_400px] min-[992px]:items-start min-[992px]:gap-10">
        <OrderSuccess data={successData} showTrackOrder={isAuthenticated} />
        <OrderSummaryPanel
          meta={successData.meta}
          items={successData.items}
          totals={successData.totals}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/8 bg-white/95 p-3 backdrop-blur-sm min-[640px]:hidden">
        <div className="mx-auto flex w-full max-w-lg gap-2.5">
          {isAuthenticated ? (
            <Link
              href={successData.trackOrderHref}
              className="flex h-11 w-full items-center justify-center rounded-lg border border-black/15 text-[13px] font-semibold text-[#191919]"
            >
              {t("orderSuccess.trackOrder")}
            </Link>
          ) : null}
          <Link
            href={successData.continueShoppingHref}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-[#191919] text-[13px] font-semibold text-white"
          >
            {t("orderSuccess.continueShopping")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccessClient;
