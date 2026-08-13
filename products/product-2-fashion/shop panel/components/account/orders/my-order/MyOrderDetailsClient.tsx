"use client";

import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/useOrder";
import { useTranslation } from "@/hooks/useTranslation";
import type { PaymentStatus as ApiPaymentStatus, OrderDetail, OrderItem } from "@/lib/api/order/service";
import Link from "next/link";
import React from "react";
import OrderInvoiceCard from "./OrderInvoiceCard";
import OrderTrackingTimeline from "./OrderTrackingTimeline";
import type { OrderInvoice } from "./types";

type Props = {
  orderId: string;
};

function getStatusBadge(orderStatus: string): { label: string; className: string } {
  const s = String(orderStatus ?? "").toLowerCase();

  if (s === "new") {
    return { label: "Pending", className: "text-[#FF8D28]" };
  }
  if (s === "approved") {
    return { label: "Confirmed", className: " text-[#0088FF]" };
  }
  if (s === "processing" || s === "shipped") {
    return { label: "Possessing", className: "text-[#00C8B3]" };
  }
  if (s === "delivered" || s === "completed") {
    return { label: "Completed", className: "text-[#34C759]" };
  }
  if (s === "cancelled" || s === "canceled") {
    return { label: "Canceled", className: "text-[#FF383C]" };
  }
  if (s === "trash") {
    return { label: "Trash", className: "bg-[#F2F2F2] text-[#6B7280]" };
  }

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  return { label, className: "bg-[#F2F2F2] text-[#6B7280]" };
}

function getPaymentStatusBadge(paymentStatus: ApiPaymentStatus, dueAmount?: number): { label: string; className: string } {
  const status = paymentStatus?.toLowerCase() || '';

  if (status === "paid") {
    return { label: "Paid", className: "text-[#34C759]" };
  }
  if (dueAmount && dueAmount > 0) {
    return { label: "Due", className: "text-[#FF383C]" };
  }
  return { label: "Cash On Delivery", className: "text-[#0088FF]" };
}

const MyOrderDetailsClient: React.FC<Props> = ({ orderId }) => {
  const { useOrderById } = useOrder();
  const { t } = useTranslation();
  const numericOrderId = React.useMemo(() => {
    const id = parseInt(orderId);
    return isNaN(id) ? 0 : id;
  }, [orderId]);

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const invoice = React.useMemo((): OrderInvoice | null => {
    if (!order) return null;

    const orderDetail: OrderDetail = order;


    if (!orderDetail.order || !orderDetail.order.id) {
      console.error("Invalid order structure:", orderDetail);
      return null;
    }

    const orderCore = orderDetail.order;
    const orderDate = orderCore.created_at ? new Date(orderCore.created_at) : new Date();
    const estimateDate = new Date(orderDate);
    estimateDate.setDate(orderDate.getDate() + 7);

    const subtotal = orderDetail.totals.subtotal || 0;
    const discount = orderDetail.totals.discount_total || 0;
    const total = orderDetail.totals.grand_total || subtotal;

    return {
      orderId: String(orderCore.id),
      currency: "BDT",

      brand: {
        logoSrc: "/logo-default.svg",
        name: "Store Name",
        address: `House 29, Road 5, Sector 11, Uttara,
Dhaka Bangladesh`,
        email: "support@vellora.demo",
        phone: "+880 1970680283",
      },

      meta: {
        orderId: String(orderCore.id),
        placedOn: orderCore.created_at
          ? new Date(orderCore.created_at).toLocaleDateString("en-GB")
          : "N/A",
        orderStatus: getStatusBadge(orderCore.order_status),
        paymentStatus: getPaymentStatusBadge(orderCore.payment_status, orderDetail.totals.due_amount),
        estimateDeliveryDate: estimateDate.toLocaleDateString("en-GB"),
      },

      invoiceTo: {
        tag: "Customer",
        name: orderCore?.customer_name || "Guest Customer",
        phone: orderCore.customer_phone || "N/A",
        address: orderCore.address?.full_address || "N/A",
      },

      items: Array.isArray(orderDetail.items)
        ? orderDetail.items.map((item: OrderItem, index: number) => ({
          id: item.id.toString(),
          title: item.product_name || "Product",
          imageSrc: item.product_image || "/placeholder-product.jpg",
          size: item.variant_name || "Standard",
          color: item.color_name || "Default",
          unitPrice: item.final_unit_price || item.selling_price || 0,
          qty: item.quantity || 0,
          totalPrice: item.line_total || ((item.final_unit_price || 0) * (item.quantity || 0)),
        }))
        : [],

      totals: {
        subtotal,
        discount: orderDetail.totals.sku_discount_total ?? discount,
        delivery: orderDetail.totals.delivery_charge || 0,
        weightKg: orderDetail.totals.weight_kg_total ?? 0,
        weightExtraCharge: orderDetail.totals.weight_extra_charge ?? 0,
        bulkDiscount: orderDetail.totals.bulk_discount_total ?? 0,
        comboDiscount: orderDetail.totals.combo_discount_total ?? 0,
        cartWideDiscount: orderDetail.totals.cart_wide_discount ?? 0,
        couponDiscount: orderDetail.totals.coupon_discount ??
          (Array.isArray(orderDetail.coupons)
            ? orderDetail.coupons.reduce((s: number, c: any) => s + Number(c.discount_amount ?? 0), 0)
            : 0),
        total,
      },
    };
  }, [order, orderId]);

  if (isLoading) {
    return (
      <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
        <Breadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("account.account"), href: "/account" },
            { label: t("account.orders.myOrder") },
          ]}
        />
        <div className="sm:mb-11.5">
          <AccountLayout sidebar={<AccountSidebar activeKey="my-order" />}>
            <div className="space-y-3">
              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <Skeleton className="h-8 w-48" />
              </div>

              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-14 w-40" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>

                  <div className="w-full max-w-[380px] space-y-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-44" />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <Skeleton className="h-px w-full" />

                {/* Invoice to section skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>

                {/* Products table skeleton */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-none" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </div>
              </div>
            </div>
          </AccountLayout>
        </div>
      </section>
    );
  }

  if (!order || !invoice) {
    return (
      <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
        <Breadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("account.account"), href: "/account" },
            { label: t("account.orders.myOrder") },
          ]}
        />
        <div className="sm:mb-11.5">
          <AccountLayout sidebar={<AccountSidebar activeKey="my-order" />}>
            <div className="space-y-3">
              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <h1 className="text-2xl font-bold text-black">{t("account.orders.myOrder")}</h1>
              </div>
              <div className="border-0 bg-white p-8 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] text-center">
                <div className="text-red-500">
                  <p className="text-lg font-medium mb-2">{t("account.orders.unableToLoad")}</p>
                  <p className="text-sm text-gray-600">
                    {error?.message || "Order not found"}
                  </p>
                </div>
                <Link
                  href="/account/orders"
                  className="mt-4 inline-block px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800"
                >
                  {t("account.orders.backToOrders")}
                </Link>
              </div>
            </div>
          </AccountLayout>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.orders.myOrder") },
        ]}
      />

      <div className="sm:mb-11.5">
        <AccountLayout
          sidebar={<AccountSidebar activeKey="my-order" />}
        >
          <div className="space-y-3">
            <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
              <h1 className="text-2xl font-bold text-black">{t("account.orders.myOrder")}</h1>
            </div>

            <OrderInvoiceCard invoice={invoice} />

            {/* ── Track Your Package ── */}
            {Array.isArray(order.couriers) && order.couriers.length > 0 && (() => {
              const courier = order.couriers[0];
              const trackingNo = courier.tracking_number;
              const provider = (courier.courier_provider || "").toLowerCase();
              const phone = order.order?.customer_phone || "";

              let trackingUrl = "";
              if (trackingNo && provider.includes("steadfast"))
                trackingUrl = `https://steadfast.com.bd/t/${trackingNo}`;
              else if (trackingNo && provider.includes("pathao"))
                trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${trackingNo}${phone ? `&phone=${phone}` : ""}`;
              else if (trackingNo && provider.includes("redx"))
                trackingUrl = `https://redx.com.bd/track-parcel/?trackingId=${trackingNo}`;

              if (!trackingNo) return null;

              return (
                <div className="bg-white p-6 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                  <h2 className="text-base font-bold text-gray-900 border-b pb-3 mb-4">
                    🚚 Track Your Package
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      {courier.courier_provider && (
                        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                          {courier.courier_provider}
                        </p>
                      )}
                      <p className="text-sm font-mono font-bold text-gray-800 break-all">
                        {trackingNo}
                      </p>
                    </div>
                    {trackingUrl ? (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded px-5 py-2.5 bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors shrink-0"
                      >
                        Track Package →
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(trackingNo)}
                        className="inline-flex items-center gap-2 rounded border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                      >
                        Copy Tracking ID
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {order.status_history && order.status_history.length > 0 && (
              <OrderTrackingTimeline 
                history={order.status_history} 
                currentStatus={order.order.order_status} 
              />
            )}
          </div>
        </AccountLayout>
      </div>
    </section>
  );
};

export default MyOrderDetailsClient;