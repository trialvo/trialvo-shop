"use client";

import AccountEditPageHeader from "@/components/account/AccountEditPageHeader";
import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/useOrder";
import { useReturnTo } from "@/hooks/useReturnTo";
import { useTranslation } from "@/hooks/useTranslation";
import type {
  PaymentStatus as ApiPaymentStatus,
  OrderDetail,
  OrderItem,
} from "@/lib/api/order/service";
import { cn } from "@/lib/utils";
import { ExternalLink, Package } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import OrderInvoiceCard from "./OrderInvoiceCard";
import OrderTrackingTimeline from "./OrderTrackingTimeline";
import type { OrderInvoice } from "./types";

type Props = {
  orderId: string;
};

function statusPill(label: string, tone: "amber" | "blue" | "teal" | "green" | "red" | "gray") {
  const tones: Record<typeof tone, string> = {
    amber: "bg-[#FFF4E8] text-[#C45F00] ring-[#FFD7A8]",
    blue: "bg-[#EAF3FF] text-[#0066CC] ring-[#BFD9FF]",
    teal: "bg-[#E8FAF7] text-[#008F82] ring-[#A8E8DF]",
    green: "bg-[#EAF9EE] text-[#1B7A3A] ring-[#B7E6C5]",
    red: "bg-[#FDECEC] text-[#C62828] ring-[#F5B5B5]",
    gray: "bg-[#F3F3F3] text-[#5F5F5F] ring-[#E0E0E0]",
  };

  return {
    label,
    className: cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
      tones[tone],
    ),
  };
}

function getStatusBadge(orderStatus: string) {
  const s = String(orderStatus ?? "").toLowerCase();

  if (s === "new") return statusPill("Pending", "amber");
  if (s === "approved") return statusPill("Confirmed", "blue");
  if (s === "processing" || s === "shipped") return statusPill("Processing", "teal");
  if (s === "delivered" || s === "completed") return statusPill("Completed", "green");
  if (s === "cancelled" || s === "canceled") return statusPill("Canceled", "red");
  if (s === "trash") return statusPill("Trash", "gray");

  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
  return statusPill(label, "gray");
}

function getPaymentStatusBadge(paymentStatus: ApiPaymentStatus, dueAmount?: number) {
  const status = paymentStatus?.toLowerCase() || "";

  if (status === "paid") return statusPill("Paid", "green");
  if (dueAmount && dueAmount > 0) return statusPill("Due", "red");
  return statusPill("Cash on delivery", "blue");
}

function OrderDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-10 w-44 rounded-full" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-56 rounded" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white p-5">
        <Skeleton className="h-14 w-40 rounded" />
        <div className="mt-6 grid gap-4 min-[768px]:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </div>
        <Skeleton className="mt-8 h-px w-full" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-[4px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-3.5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MyOrderDetailsClient: React.FC<Props> = ({ orderId }) => {
  const { useOrderById } = useOrder();
  const { t } = useTranslation();
  const { returnTo, navigateBack } = useReturnTo("/account/orders");

  const numericOrderId = React.useMemo(() => {
    const id = parseInt(orderId, 10);
    return Number.isNaN(id) ? 0 : id;
  }, [orderId]);

  const { data: order, isLoading, error } = useOrderById(numericOrderId);

  const backLabel =
    returnTo === "/account" || returnTo.startsWith("/account?")
      ? t("account.backToAccount")
      : t("account.orders.backToOrders");

  const invoice = React.useMemo((): OrderInvoice | null => {
    if (!order) return null;

    const orderDetail: OrderDetail = order;

    if (!orderDetail.order || !orderDetail.order.id) {
      return null;
    }

    const orderCore = orderDetail.order;
    const orderDate = orderCore.created_at
      ? new Date(orderCore.created_at)
      : new Date();
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
        paymentStatus: getPaymentStatusBadge(
          orderCore.payment_status,
          orderDetail.totals.due_amount,
        ),
        estimateDeliveryDate: estimateDate.toLocaleDateString("en-GB"),
      },

      invoiceTo: {
        tag: "Customer",
        name: orderCore?.customer_name || "Guest Customer",
        phone: orderCore.customer_phone || "N/A",
        address: orderCore.address?.full_address || "N/A",
      },

      items: Array.isArray(orderDetail.items)
        ? orderDetail.items.map((item: OrderItem) => ({
            id: item.id.toString(),
            title: item.product_name || "Product",
            imageSrc: item.product_image || "/placeholder-product.jpg",
            size: item.variant_name || "Standard",
            color: item.color_name || "Default",
            unitPrice: item.final_unit_price || item.selling_price || 0,
            qty: item.quantity || 0,
            totalPrice:
              item.line_total ||
              (item.final_unit_price || 0) * (item.quantity || 0),
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
        couponDiscount:
          orderDetail.totals.coupon_discount ??
          (Array.isArray(orderDetail.coupons)
            ? orderDetail.coupons.reduce(
                (s: number, c: { discount_amount?: number }) =>
                  s + Number(c.discount_amount ?? 0),
                0,
              )
            : 0),
        total,
      },
    };
  }, [order]);

  const trackingCard = React.useMemo(() => {
    if (!order || !Array.isArray(order.couriers) || order.couriers.length === 0) {
      return null;
    }

    const courier = order.couriers[0];
    const trackingNo = courier.tracking_number;
    if (!trackingNo) return null;

    const provider = (courier.courier_provider || "").toLowerCase();
    const phone = order.order?.customer_phone || "";

    let trackingUrl = "";
    if (provider.includes("steadfast")) {
      trackingUrl = `https://steadfast.com.bd/t/${trackingNo}`;
    } else if (provider.includes("pathao")) {
      trackingUrl = `https://merchant.pathao.com/tracking?consignment_id=${trackingNo}${
        phone ? `&phone=${phone}` : ""
      }`;
    } else if (provider.includes("redx")) {
      trackingUrl = `https://redx.com.bd/track-parcel/?trackingId=${trackingNo}`;
    }

    return { courier, trackingNo, trackingUrl };
  }, [order]);

  const pageShell = (children: React.ReactNode) => (
    <section className="container mx-auto px-3 pb-28 pt-2 min-[640px]:pb-14 min-[768px]:px-0 min-[768px]:pt-0">
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("account.account"), href: "/account" },
            { label: t("account.orders.myOrder"), href: "/account/orders" },
            { label: `#${orderId}` },
          ]}
        />
      </div>

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout
          sidebar={
            <div className="print:hidden">
              <AccountSidebar activeKey="my-order" />
            </div>
          }
        >
          {children}
        </AccountLayout>
      </div>
    </section>
  );

  if (isLoading) {
    return pageShell(<OrderDetailsSkeleton />);
  }

  if (!order || !invoice) {
    return pageShell(
      <div className="space-y-6">
        <AccountEditPageHeader
          eyebrow={t("account.orders.myOrder")}
          title={t("account.orders.orderDetails")}
          description={t("account.orders.orderDetailsDescription")}
          onBack={navigateBack}
          backLabel={backLabel}
        />

        <div className="rounded-2xl border border-black/8 bg-white px-5 py-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#F3F1ED]">
            <Package className="h-5 w-5 text-[#8A8A8A]" />
          </div>
          <p className="mt-4 text-[15px] font-semibold text-[#191919]">
            {t("account.orders.unableToLoad")}
          </p>
          <p className="mt-1 text-sm text-[#5F5F5F]">
            {error?.message || t("account.orders.orderNotFound")}
          </p>
          <button
            type="button"
            onClick={navigateBack}
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[#191919] px-5 text-[13px] font-semibold text-white hover:bg-black"
          >
            {backLabel}
          </button>
        </div>
      </div>,
    );
  }

  return pageShell(
    <div className="space-y-6">
      <div className="print:hidden">
        <AccountEditPageHeader
          eyebrow={t("account.orders.myOrder")}
          title={`${t("account.orders.orderDetails")} #${invoice.orderId}`}
          description={t("account.orders.orderDetailsDescription")}
          onBack={navigateBack}
          backLabel={backLabel}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white print:overflow-visible print:rounded-none print:border-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 px-3 py-4 print:hidden min-[768px]:px-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
            {t("account.orders.invoice")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className={invoice.meta.orderStatus.className}>
              {invoice.meta.orderStatus.label}
            </span>
            <span className={invoice.meta.paymentStatus.className}>
              {invoice.meta.paymentStatus.label}
            </span>
          </div>
        </div>

        <div className="px-3 py-4 min-[768px]:px-4 min-[768px]:py-5 print:p-0">
          <OrderInvoiceCard invoice={invoice} />
        </div>
      </div>

      {trackingCard ? (
        <div className="overflow-hidden rounded-2xl border border-black/8 bg-white print:hidden">
          <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
              {t("account.orders.trackPackage")}
            </p>
          </div>
          <div className="flex flex-col gap-4 px-4 py-5 min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between min-[768px]:px-5">
            <div className="min-w-0 space-y-1">
              {trackingCard.courier.courier_provider ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A8A8A]">
                  {trackingCard.courier.courier_provider}
                </p>
              ) : null}
              <p className="break-all font-mono text-sm font-semibold text-[#191919]">
                {trackingCard.trackingNo}
              </p>
            </div>

            {trackingCard.trackingUrl ? (
              <a
                href={trackingCard.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#191919] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-black"
              >
                {t("account.orders.trackOnCourier")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(trackingCard.trackingNo);
                    toast.success("Tracking ID copied");
                  } catch {
                    toast.error("Could not copy tracking ID");
                  }
                }}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-black/12 bg-white px-5 text-[13px] font-semibold text-[#191919] transition-colors hover:border-black/20 hover:bg-[#FAF8F5]"
              >
                {t("account.orders.copyTrackingId")}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {order.status_history && order.status_history.length > 0 ? (
        <div className="print:hidden">
          <OrderTrackingTimeline
            history={order.status_history}
            currentStatus={order.order.order_status}
          />
        </div>
      ) : null}
    </div>,
  );
};

export default MyOrderDetailsClient;
