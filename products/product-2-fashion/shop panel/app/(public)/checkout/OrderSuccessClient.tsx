"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import OrderSuccess from "@/components/order-success/OrderSuccess";
import { OrderSuccessData } from "@/components/order-summary/order.types";
import OrderSummaryPanel from "@/components/order-summary/OrderSummaryPanel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useOrder } from "@/hooks/useOrder";
import type { OrderItem as ApiOrderItem, OrderDetail } from "@/lib/api/order/service";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useTranslation } from "@/hooks/useTranslation";

const OrderSuccessClient: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { useOrderById } = useOrder();
  const { t } = useTranslation();

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const numericOrderId = React.useMemo(() => {
    const id = parseInt(orderId, 10);
    return isNaN(id) ? 0 : id;
  }, [orderId]);

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const successData = React.useMemo((): OrderSuccessData | null => {
    if (!order) return null;

    const orderDetail: OrderDetail = order;

    const getPaymentMethodDisplay = (paymentType: string): string => {
      switch (paymentType) {
        case 'cod': return 'Cash on Delivery';
        case 'gateway': return 'Online Payment';
        case 'mixed': return 'Mixed Payment';
        default: return paymentType?.charAt(0).toUpperCase() + paymentType?.slice(1);
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
        date: orderDetail.order.created_at ? new Date(orderDetail.order?.created_at).toLocaleDateString("en-GB") : "N/A",
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

  /* ── Analytics: Purchase ── */
  const { trackPurchase } = useAnalytics();
  React.useEffect(() => {
    if (!successData) return;

    try {
      // Create a unique key for the order
      const storageKey = `tracked_order_${successData.meta.orderId}`;
      const hasTracked = localStorage.getItem(storageKey);

      // If we already tracked this order, don't track again
      if (hasTracked) return;

      // Track the purchase
      trackPurchase({
        value: successData.totals.total,
        order_id: successData.meta.orderId,
        content_ids: successData.items.map((i) => String(i.id)),
        num_items: successData.items.length,
      });

      // Mark this order as tracked in localStorage
      localStorage.setItem(storageKey, "true");
    } catch (e) {
      // In case localStorage is disabled or throws an error
      console.warn("Could not access localStorage for tracking order deduplication", e);
    }
  }, [successData, trackPurchase]);


  if (isLoading) {
    return (
      <section className="container mx-auto pb-6">
        <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("checkout.breadcrumb") }]} />
        <Card className="mt-6 rounded-none border-[#F1F1F1] shadow-sm p-6">
          <div className="flex flex-col gap-12.5 justify-between lg:flex-row">
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-3/6" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-48" />
              </div>
            </div>

            <div className="w-full space-y-6 lg:w-[420px]">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  const paymentStatus = searchParams.get("payment") || "";
  const isPaymentFailed = paymentStatus === "failed" || paymentStatus === "cancelled";

  // Show payment failure/cancellation UI regardless of auth state
  if (isPaymentFailed) {
    const isFailed = paymentStatus === "failed";
    return (
      <section className="container mx-auto pb-6">
        <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("checkout.breadcrumb") }]} />
        <Card className="mt-6 rounded-none border-[#F1F1F1] shadow-sm p-6">
          <div className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-700">
              {isFailed ? "Payment Failed" : "Payment Cancelled"}
            </h2>
            {orderId && (
              <p className="text-gray-600 mb-1">
                Order <strong>#{orderId}</strong>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              {isFailed
                ? "Your payment could not be processed. Please try again or contact support."
                : "Your payment was cancelled. Your order is still saved — you can retry payment."}
            </p>
            <div className="flex justify-center gap-3">
              {isAuthenticated && (
                <Link
                  href="/account/orders"
                  className="inline-block px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  {t("orderSuccess.viewAllOrders")}
                </Link>
              )}
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800"
              >
                {t("orderSuccess.continueShopping")}
              </Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  // For unauthenticated users (e.g. single-page orders), show a simple status page
  // when order details can't be loaded but we have a payment status from the callback
  if (error || !order || !successData) {
    // If we have a payment=success param, show a success result page
    if (paymentStatus === "success" && orderId) {
      return (
        <section className="container mx-auto pb-6">
          <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("checkout.breadcrumb") }]} />
          <Card className="mt-6 rounded-none border-[#F1F1F1] shadow-sm p-6">
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-green-700">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-1">
                Order <strong>#{orderId}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your payment has been processed successfully. We will contact you shortly to confirm delivery.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800"
              >
                {t("orderSuccess.continueShopping")}
              </Link>
            </div>
          </Card>
        </section>
      );
    }

    return (
      <section className="container mx-auto pb-6">
        <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("checkout.breadcrumb") }]} />
        <Card className="mt-6 rounded-none border-[#F1F1F1] shadow-sm p-6">
          <div className="text-center py-12">
            <div className="text-red-500">
              <p className="text-lg font-medium mb-2">{t("orderSuccess.unableToLoad")}</p>
              <p className="text-sm text-gray-600 mb-4">
                {error?.message || t("orderSuccess.orderNotFound")}
              </p>
              <p className="text-xs text-gray-500">
                {t("orderSuccess.orderIdLabel")} {orderId || t("orderSuccess.notProvided")}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {isAuthenticated ? (
                <Link
                  href="/account/orders"
                  className="inline-block px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800"
                >
                  {t("orderSuccess.viewAllOrders")}
                </Link>
              ) : null}
              <Link
                href="/"
                className="inline-block px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 ml-3"
              >
                {t("orderSuccess.continueShopping")}
              </Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="container mx-auto sm:pb-6">
      <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("checkout.breadcrumb") }]} />

      <Card className="sm:mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] p-4 sm:p-6">
        <div className="flex flex-col sm:gap-12.5 justify-between sm:flex-row">
          <OrderSuccess data={successData} showTrackOrder={isAuthenticated} />
          <OrderSummaryPanel
            meta={successData.meta}
            items={successData.items}
            totals={successData.totals}
          />
        </div>
      </Card>
      <div className="fixed z-20 inset-x-0 bottom-0 border-t border-black/10 bg-white p-4 shadow-[0_-6px_18px_rgba(0,0,0,0.08)] sm:hidden">
        <div className="mx-auto flex w-full max-w-lg flex-row gap-3">
          {isAuthenticated ? (
            <Link
              href={successData.trackOrderHref}
              className="flex h-11 w-full items-center justify-center border border-black/30 text-sm font-semibold text-black"
            >
              {t("orderSuccess.trackOrder")}
            </Link>
          ) : null}
          <Link
            href={successData.continueShoppingHref}
            className="flex h-11 w-full items-center justify-center bg-black text-sm font-semibold text-white"
          >
            {t("orderSuccess.continueShopping")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccessClient;
