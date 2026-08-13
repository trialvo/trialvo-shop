"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import OrderSummaryPanel from "@/components/order-summary/OrderSummaryPanel";
import { Card } from "@/components/ui/card";
import { useOrder } from "@/hooks/useOrder";
import type { OrderDetail } from "@/lib/api/order/service";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import OrderFailed from "./OrderFailed";
import { OrderFailedData } from "./failed.types";

const OrderFailedClient: React.FC = () => {
  const { useOrderById } = useOrder();

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const numericOrderId = React.useMemo(() => {
    const id = parseInt(orderId, 10);
    return isNaN(id) ? 0 : id;
  }, [orderId]);

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const failedData = React.useMemo((): OrderFailedData | null => {
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
      id: orderDetail?.order?.id,
      title: "Payment Failed",
      message: "We're sorry, but there was a problem processing your payment. Our team has been notified and will contact you shortly.",
      supportEmail: "support@vellora.demo",
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
        ? orderDetail.items.map((item) => ({
          id: String(item.id),
          title: item.product_name || "Product",
          image: item.product_image || "/placeholder-product.jpg",
          quantity: item.quantity || 0,
          price: item.final_unit_price || item.selling_price || 0,
          originalPrice: item.selling_price || undefined,
          oldPrice: item.selling_price > item.final_unit_price ? item.selling_price : undefined,
        }))
        : [],
      totals: {
        subtotal: orderDetail.totals.subtotal || 0,
        delivery: orderDetail.totals.delivery_charge || 0,
        discount: orderDetail.totals.discount_total || 0,
        total: orderDetail.totals.grand_total || 0,
      },
      trackOrderHref: `/account/orders/${orderDetail.order.id}`,
      continueShoppingHref: "/",
    };
  }, [order, orderId]);

  if (isLoading) {
    return (
      <section className="container mx-auto pb-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
        <Card className="mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] p-6">
          <div className="flex gap-12.5 justify-between">
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

            <div className="w-[420px] space-y-6">
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

  if (error || !order || !failedData) {
    return (
      <section className="container mx-auto pb-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
        <Card className="mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] p-6">
          <div className="text-center py-12">
            <div className="text-red-500">
              <p className="text-lg font-medium mb-2">Unable to load order details</p>
              <p className="text-sm text-gray-600 mb-4">
                {error?.message || "Order not found or invalid order ID"}
              </p>
              <p className="text-xs text-gray-500">
                Order ID: {orderId || "Not provided"}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <Link
                href="/account/orders"
                className="inline-block px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800"
              >
                View All Orders
              </Link>
              <Link
                href="/"
                className="inline-block px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 ml-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="container mx-auto sm:pb-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />

      <Card className="mt-6 rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-12.5">
          <div className="flex-1">
            <OrderFailed data={failedData} />
          </div>
          <div className="w-full sm:w-105 sm:min-w-105">
            <OrderSummaryPanel 
              meta={failedData.meta} 
              items={failedData.items} 
              totals={failedData.totals} 
            />
          </div>
        </div>
      </Card>
    </section>
  );
};

export default OrderFailedClient;
