import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, AlertCircle, RefreshCw, Hash } from "lucide-react";

import OrderEditorHeader from "./OrderEditorHeader";
import OrderFormCard from "./OrderFormCard";
import ProductCalculationsCard from "./ProductCalculationsCard";
import SidebarCourierCard from "./SidebarCourierCard";
import SidebarCustomerHistoryCard from "./SidebarCustomerHistoryCard";
import SidebarInfoCard from "./SidebarInfoCard";
import SidebarShippingStickerCard from "./SidebarShippingStickerCard";
import OrderRefundPanel from "./OrderRefundPanel";
import { AlertTriangle, Lock } from "lucide-react";

import type { OrderEditorData, OrderProductLine } from "./types";

import {
  getAdminOrderById,
  ordersKeys,
  patchOrderPaymentStatus,
  patchOrderStatus,
  updateOrderItems,
  updateOrderInfo,
  dispatchOrderCourier,
  manualDispatchOrder,
  syncCourierStatus,
  getCourierBalance,
  type ApiOrder,
  type UpdateOrderItemsPayload,
  type DispatchCourierProvider,
} from "@/api/orders.api";
import { toPublicUrl } from "@/utils/toPublicUrl";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

const statusLabel = (status: OrderEditorData["orderStatus"]): string => {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const LOCKED_STATUSES = ["delivered", "cancelled", "returned", "trash"] as const;
const WARN_STATUSES   = ["shipped", "out_for_delivery"] as const;

type LockedStatus = typeof LOCKED_STATUSES[number];
type WarnStatus   = typeof WARN_STATUSES[number];

const formatDateLabel = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTimeLabel = (iso?: string): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const timeAgoLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const calcLineTotals = (
  p: OrderProductLine,
): { original: number; discountAmt: number; net: number; tax: number } => {
  const original = p.unitPrice * p.quantity;
  const discountAmt = p.discount * p.quantity;
  const net = Math.max(0, original - discountAmt);
  const tax = 0;
  return { original, discountAmt, net, tax };
};

function paymentLabelFromOrder(o: ApiOrder) {
  if (o.payment_type === "cod") return "Payment via Cash on delivery";
  const provider = (o.payments ?? []).slice(-1)[0]?.provider ?? "gateway";
  return `Payment via ${provider} gateway`;
}

function mapApiOrderToEditorData(o: ApiOrder): OrderEditorData {
  const deliveryType = (o.city || "").toLowerCase().includes("dhaka")
    ? "inside_dhaka"
    : "out_of_dhaka";

  const products: OrderProductLine[] = (o.items ?? []).map((it) => ({
    id: String(it.id),
    sku: it.sku ? String(it.sku) : `#${it.product_sku_id}`,
    serialNo: it.brand_name ? String(it.brand_name) : it.product_name,
    name: it.product_name,
    imageUrl: toPublicUrl(it.product_image ?? null) ?? undefined,
    color: it.color_name ?? "N/A",
    size: it.variant_name ?? it.attribute_name ?? "N/A",
    discount: Number(it.discount ?? 0),
    unitPrice: Number(it.selling_price ?? 0),
    quantity: Number(it.quantity ?? 1),
    // API reference IDs
    productId: it.product_id,
    productSkuId: it.product_sku_id,
    colorId: it.color_id,
    variantId: it.variant_id,
    attributeId: it.attribute_id,
    colorHex: it.color_hex,
    weight_kg: typeof it.weight_kg === "number" ? it.weight_kg : Number(it.weight_kg ?? 0),
  }));

  const firstCourier = (o.couriers ?? [])[0];

  return {
    orderId: String(o.id),
    orderNumber: String(o.id),
    orderDate: o.created_at,

    billingName: (o.customer_name || "").trim() || "N/A",
    email: o.customer_email || "N/A",

    shippingAddress: o.full_address || "N/A",
    city: o.lm_city_name || o.city || "N/A",
    area_name: o.area_name || "",
    location_mapping_id: o.location_mapping_id ?? null,
    postalCode: o.zip_code || "N/A",

    phone: o.customer_phone || "N/A",

    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_type,

    note: o.note ?? "",

    products,

    deliveryCharge: Number(o.delivery_charge ?? 0),
    specialDiscount: Number(o.discount_total ?? 0),
    advancePayment: Number(o.paid_amount ?? 0),
    weightKgTotal: (firstCourier?.weight != null && Number(firstCourier.weight) > 0)
      ? Number(firstCourier.weight)
      : Number(o.weight_kg_total ?? 0),
    weightExtraCharge: Number(o.weight_extra_charge ?? 0),
    bulkDiscountTotal: Number((o as any).bulk_discount_total ?? 0),
    comboDiscountTotal: Number((o as any).combo_discount_total ?? 0),
    cartWideDiscount: Number((o as any).cart_wide_discount ?? 0),
    couponDiscount: Number((o as any).coupon_discount ?? 0),

    courier: {
      method: firstCourier?.courier_provider ?? "manual",
      consignmentId:
        firstCourier?.reference_id !== null &&
          firstCourier?.reference_id !== undefined
          ? String(firstCourier.reference_id)
          : (firstCourier?.memo ?? ""),
      trackingUrl: (() => {
        const trackingNo = firstCourier?.tracking_number ?? "";
        const prov = (firstCourier?.courier_provider ?? "").toLowerCase();
        const phone = (o.customer_phone ?? "").replace(/\D/g, "");
        if (!trackingNo) return undefined;
        if (prov.includes("steadfast"))
          return `https://steadfast.com.bd/t/${trackingNo}`;
        if (prov.includes("pathao"))
          return `https://merchant.pathao.com/tracking?consignment_id=${trackingNo}${phone ? `&phone=${phone}` : ""}`;
        if (prov.includes("redx"))
          return `https://redx.com.bd/track-parcel/?trackingId=${trackingNo}`;
        if (prov.includes("paperfly"))
          return `https://paperfly.com.bd/tracking/?trackId=${trackingNo}`;
        return `Tracking: ${trackingNo}`;
      })(),
      lastUpdatedAt: firstCourier?.created_at,
    },

    customerInfo: {
      name: (o.customer_name || "").trim() || "N/A",
      phone: o.customer_phone || "N/A",
      email: o.customer_email || "N/A",
      address: `${o.city ?? ""} ${o.full_address ?? ""}`.trim() || "N/A",
    },

    customerHistory: {
      orderId: `#${o.id}`,
      shipping:
        deliveryType === "inside_dhaka" ? "Inside Dhaka" : "Out of Dhaka",
      orderDate: o.created_at,
      totalAmount: Number(o.grand_total ?? 0),
      timeAgo: timeAgoLabel(o.created_at),
      orderStatus: o.order_status,
      sentBy: "manually",
      additionalNotes: o.note ?? "N/A",
    },
  };
}

type Props = {
  orderId: number | null;
  onBack?: () => void;
};

const OrderEditorPage: React.FC<Props> = ({ orderId, onBack }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);

  const detailQuery = useQuery({
    queryKey: ordersKeys.detail(orderId ?? "none"),
    queryFn: () => {
      if (!orderId) throw new Error("orderId missing");
      return getAdminOrderById(orderId);
    },
    enabled: Boolean(orderId),
    retry: 1,
  });

  const [data, setData] = useState<OrderEditorData | null>(null);

  const snapshotRef = useRef<{ orderStatus?: string; paymentStatus?: string }>({
    orderStatus: undefined,
    paymentStatus: undefined,
  });

  // Reset when orderId changes
  useEffect(() => {
    hydratedRef.current = false;
    setData(null);
    snapshotRef.current = { orderStatus: undefined, paymentStatus: undefined };
  }, [orderId]);

  useEffect(() => {
    if (!detailQuery.data?.success) return;
    if (hydratedRef.current) return;

    const mapped = mapApiOrderToEditorData(detailQuery.data.data);
    setData(mapped);

    snapshotRef.current = {
      orderStatus: mapped.orderStatus,
      paymentStatus: mapped.paymentStatus,
    };

    hydratedRef.current = true;
  }, [detailQuery.data]);

  const totals = useMemo(() => {
    if (!data) {
      return {
        itemCount: 0,
        originalTotal: 0,
        productDiscount: 0,
        subTotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        payable: 0,
      };
    }

    const lineTotals = data.products.map(calcLineTotals);
    const originalTotal = lineTotals.reduce((s, t) => s + t.original, 0);
    const productDiscount = lineTotals.reduce((s, t) => s + t.discountAmt, 0);
    const subTotal = lineTotals.reduce((s, t) => s + t.net, 0);
    const items = data.products.reduce((s, p) => s + p.quantity, 0);

    const grandTotal = subTotal
      + (Number(data.deliveryCharge) || 0)
      + (Number(data.weightExtraCharge) || 0)
      - (Number(data.bulkDiscountTotal) || 0)
      - (Number(data.comboDiscountTotal) || 0)
      - (Number(data.cartWideDiscount) || 0)
      - (Number(data.couponDiscount) || 0);
    const payable =
      grandTotal -
      (Number(data.specialDiscount) || 0) -
      (Number(data.advancePayment) || 0);

    return {
      itemCount: items,
      originalTotal,
      productDiscount,
      subTotal,
      taxTotal: 0,
      grandTotal,
      payable: Math.max(0, payable),
      bulkDiscountTotal: Number(data.bulkDiscountTotal) || 0,
      comboDiscountTotal: Number(data.comboDiscountTotal) || 0,
      cartWideDiscount: Number(data.cartWideDiscount) || 0,
    };
  }, [data]);

  const paymentMutation = useMutation({
    mutationFn: (payload: {
      orderId: number;
      new_payment_status: "unpaid" | "partial_paid" | "paid";
    }) => patchOrderPaymentStatus(payload.orderId, payload.new_payment_status),
    onSuccess: async () => {
      toast.success(t("orders.orderEditor.paymentStatusUpdated"));
      await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("orders.orderEditor.failedPaymentStatus"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: {
      orderId: number;
      new_status: ApiOrder["order_status"];
    }) => patchOrderStatus(payload.orderId, payload.new_status),
    onSuccess: async (result, payload) => {
      toast.success(t("orders.orderEditor.orderStatusUpdated"));
      await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });

      // If the cancellation triggered a pending refund, notify the admin
      if (result?.data?.refund_suggested) {
        const refundAmt = result.data.refund_amount;
        toast(
          `↩ Refund required: Customer paid ৳${Number(refundAmt).toLocaleString()}. A pending refund entry has been created — please process it from the Refund Ledger below.`,
          { duration: 8000, icon: "⚠️" }
        );
        // Refresh the refund panel
        await queryClient.invalidateQueries({ queryKey: ["order-refunds", payload.orderId] });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("orders.orderEditor.failedOrderStatus"));
    },
  });

  const handleChangeForm = <K extends keyof OrderEditorData>(
    key: K,
    value: OrderEditorData[K],
  ) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmitTop = async () => {
    if (!data || !orderId) return;

    const prev = snapshotRef.current;
    const nextStatus = data.orderStatus;
    const nextPay = data.paymentStatus;

    const jobs: Promise<any>[] = [];

    // Always push info mutation on save
    jobs.push(
      updateOrderInfo(orderId, {
        customer_name: data.billingName,
        customer_phone: data.phone,
        customer_email: data.email,
        payment_type: data.paymentMethod,
        note: data.note,
        full_address: data.shippingAddress,
        city: data.city,
        zip_code: data.postalCode,
        location_mapping_id: data.location_mapping_id ?? undefined,
      }).catch((err: any) => {
        toast.error(err?.message ?? "Failed to update order info.");
        throw err;
      })
    );

    if (prev.orderStatus !== nextStatus) {
      jobs.push(
        statusMutation.mutateAsync({ orderId, new_status: nextStatus })
      );
    }

    if (prev.paymentStatus !== nextPay) {
      jobs.push(
        paymentMutation.mutateAsync({ orderId, new_payment_status: nextPay })
      );
    }

    if (!jobs.length) {
      toast(t("orders.orderEditor.nothingChanged"));
      return;
    }

    await Promise.all(jobs);

    snapshotRef.current = {
      orderStatus: nextStatus,
      paymentStatus: nextPay,
    };

    toast.success(t("orders.orderEditor.orderUpdated"));
  };

  const handleChangeLine = (id: string, patch: Partial<OrderProductLine>) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      };
    });
  };

  const handleDeleteLine = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, products: prev.products.filter((p) => p.id !== id) };
    });
  };

  const handleAddLine = (newLine: OrderProductLine) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, products: [newLine, ...prev.products] };
    });
  };

  const handleChangeTotals = (patch: {
    deliveryCharge?: number;
    specialDiscount?: number;
    advancePayment?: number;
  }) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        deliveryCharge:
          patch.deliveryCharge !== undefined
            ? Number(patch.deliveryCharge) || 0
            : prev.deliveryCharge,
        specialDiscount:
          patch.specialDiscount !== undefined
            ? Number(patch.specialDiscount) || 0
            : prev.specialDiscount,
        advancePayment:
          patch.advancePayment !== undefined
            ? Number(patch.advancePayment) || 0
            : prev.advancePayment,
      };
    });
  };

  const itemsMutation = useMutation({
    mutationFn: (payload: { orderId: number; data: UpdateOrderItemsPayload }) =>
      updateOrderItems(payload.orderId, payload.data),
    onSuccess: async () => {
      toast.success(t("orders.orderEditor.orderUpdated"));
      await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("orders.orderEditor.failedOrderStatus"));
    },
  });

  const handleSubmitProducts = async () => {
    if (!data || !orderId) return;

    const items = data.products
      .filter((p) => p.productSkuId)
      .map((p) => ({
        order_item_id: Number(p.id),
        product_sku_id: p.productSkuId!,
        quantity: p.quantity,
        discount: p.discount,
        weight_kg: typeof p.weight_kg === "number" ? p.weight_kg : 0,
      }));

    if (!items.length) {
      toast(t("orders.orderEditor.noProductsApi"));
      return;
    }

    await itemsMutation.mutateAsync({
      orderId,
      data: {
        items,
        delivery_charge: data.deliveryCharge,
        discount_total: data.specialDiscount,
      },
    });
  };

  const handleCourierChange = (patch: {
    method?: string;
    consignmentId?: string;
  }) => {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, courier: { ...prev.courier, ...patch } };
    });
  };

  // ── Dispatch result state for courier banner ──
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message: string;
    detail?: string;
    tracking?: string;
  } | null>(null);

  const courierDispatchMutation = useMutation({
    mutationFn: async (payload: { method: string; data: any }) => {
      if (!orderId) throw new Error("No order ID");
      if (payload.method === "manual") {
        return manualDispatchOrder(orderId, payload.data);
      }
      return dispatchOrderCourier(orderId, payload.data);
    },
    onSuccess: async (res) => {
      setDispatchResult({
        success: true,
        message: res?.message || "Order dispatched successfully!",
        tracking: res?.tracking_number,
      });
      toast.success(res?.message || "Order dispatched successfully!");
      hydratedRef.current = false;
      await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? "Failed to dispatch order";
      setDispatchResult({ success: false, message: "Dispatch Failed", detail });
      toast.error(detail);
    },
  });

  const handleCourierSendAuto = async (provider: string, weight: number) => {
    if (!data) return;
    await courierDispatchMutation.mutateAsync({
      method: "auto",
      data: {
        courier_provider: provider as DispatchCourierProvider,
        weight: weight || undefined,
      },
    });
  };

  const handleCourierSendManual = async (payload: {
    courier_provider: string;
    tracking_number?: string;
    reference_id?: string;
    memo?: string;
    weight?: number;
  }) => {
    if (!data) return;
    await courierDispatchMutation.mutateAsync({
      method: "manual",
      data: payload,
    });
  };

  const handleCourierComplete = async () => {
    if (!orderId) return;
    try {
      await statusMutation.mutateAsync({ orderId, new_status: "delivered" });
    } catch { /* handled by mutation onError */ }
  };

  const handleCourierInvoice = () => {
    if (!orderId) return;
    window.open(`/order-invoice/${orderId}`, "_blank");
  };
  const handleInvoiceDownload = () => toast(t("orders.orderEditor.noInvoiceApi"));
  const handleOpenStickerGenerator = () =>
    toast(t("orders.orderEditor.noStickerApi"));

  const [syncingStatus, setSyncingStatus] = useState(false);
  const handleSyncStatus = async () => {
    if (!orderId || syncingStatus) return;
    setSyncingStatus(true);
    try {
      const result = await syncCourierStatus(orderId);
      if (result.updated) {
        await queryClient.refetchQueries({ queryKey: ordersKeys.details(), type: "active" });
        await queryClient.refetchQueries({ queryKey: ordersKeys.lists(), type: "active" });
        toast.success(result.message);
      } else {
        toast(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to sync courier status");
    } finally {
      setSyncingStatus(false);
    }
  };

  // ─── Derived (unconditional — hooks MUST come before conditional returns) ──
  const apiOrder = detailQuery.data?.data;
  const paymentLabel = apiOrder ? paymentLabelFromOrder(apiOrder) : "Payment";
  const courierOption = detailQuery.data?.courierOption;

  // ── Courier balance queries (parallel fetch for all auto-connected providers) ──
  const autoConnectedList = useMemo(() => {
    return (courierOption?.available_providers ?? []).filter((p: any) => p.is_auto_available);
  }, [courierOption?.available_providers]);

  const balanceQueries = useQueries({
    queries: autoConnectedList.map((c: any) => ({
      queryKey: ["courier-balance", c.provider],
      queryFn: () => getCourierBalance(String(c.provider)),
      enabled: Boolean(orderId) && !detailQuery.isLoading,
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const balanceByProvider = useMemo(() => {
    const map: Record<string, { balance: number | null; loading: boolean }> = {};
    autoConnectedList.forEach((c: any, i: number) => {
      const q = balanceQueries[i];
      map[String(c.provider)] = {
        balance: (q?.data as any)?.balance ?? null,
        loading: q?.isFetching ?? false,
      };
    });
    return map;
  }, [balanceQueries, autoConnectedList]);

  // ─── No order ID ───────────────────────────────────────────
  if (!orderId) {
    return (
      <div className="mx-auto w-full">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <AlertCircle size={16} className="text-amber-500" />
            {t("orders.orderEditor.missingOrderId")}{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              /order-editor?orderId=23
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───────────────────────────────────────────────
  if (detailQuery.isLoading || !data) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 md:px-6">
        <div className="space-y-4">
          {/* Skeleton header */}
          <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          </div>
          {/* Skeleton body */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-3">
                  <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-10 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-10 w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-10 w-2/3 rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </div>
            <div className="space-y-4 lg:col-span-4">
              <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-3">
                  <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (detailQuery.isError) {
    const msg = (detailQuery.error as any)?.message ?? t("orders.orderEditor.failedLoadOrder");
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 md:px-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-500/30 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="font-semibold text-red-600 dark:text-red-400">
                {msg}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {onBack ? (
                  <Button onClick={onBack} variant="primary" size="sm" startIcon={<ArrowLeft size={14} />}>
                    {t("orders.orderEditor.backToOrders")}
                  </Button>
                ) : null}
                <Button
                  onClick={() => detailQuery.refetch()}
                  variant="outline"
                  size="sm"
                  startIcon={<RefreshCw size={14} />}
                >
                  {t("common.refresh")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ─── Main Layout ───────────────────────────────────────────
  return (
    <div className="mx-auto w-full">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {onBack ? (
            <Button onClick={onBack} size="sm" variant="outline" startIcon={<ArrowLeft size={14} />}>
              {t("orders.orderEditor.backToOrders")}
            </Button>
          ) : null}
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Hash size={12} className="text-gray-400" />
          <span className="uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("orders.orderEditor.orderId")}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">
            {orderId}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <OrderEditorHeader
          orderNumber={data.orderNumber}
          orderId={data.orderId}
          orderStatus={data.orderStatus}
          paymentStatus={data.paymentStatus}
          orderDateLabel={formatDateLabel(data.orderDate)}
          paymentLabel={paymentLabel}
          statusLabel={statusLabel(data.orderStatus)}
          customerIp={data.customerIp}
        />

        {/* ── Status Banner ────────────────────────────────────────── */}
        {(LOCKED_STATUSES as readonly string[]).includes(data.orderStatus) && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
            <Lock size={16} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                Order Locked — {statusLabel(data.orderStatus)}
              </div>
              <div className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
                This order is closed. Items, delivery charge, and customer info cannot be edited.
              </div>
            </div>
          </div>
        )}
        {(WARN_STATUSES as readonly string[]).includes(data.orderStatus) && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Caution — Order is {statusLabel(data.orderStatus)}
              </div>
              <div className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
                This order has already been dispatched. Edits will update the record but may not reflect the physical shipment. The customer will be notified if the total changes.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <OrderFormCard
              values={{
                billingName: data.billingName,
                shippingAddress: data.shippingAddress,
                orderStatus: data.orderStatus,
                phone: data.phone,
                paymentStatus: data.paymentStatus,
                city: data.city,
                area_name: data.area_name,
                location_mapping_id: data.location_mapping_id,
                postalCode: data.postalCode,
                email: data.email,
                paymentMethod: data.paymentMethod,
                note: data.note,
              }}
              onChange={(key, value) => handleChangeForm(key, value as never)}
              onSubmit={handleSubmitTop}
            />

            <ProductCalculationsCard
              products={data.products}
              onChangeLine={handleChangeLine}
              onDeleteLine={handleDeleteLine}
              onAddLine={handleAddLine}
              deliveryCharge={data.deliveryCharge}
              specialDiscount={data.specialDiscount}
              advancePayment={data.advancePayment}
              weightKgTotal={data.weightKgTotal}
              weightExtraCharge={data.weightExtraCharge}
              onChangeTotals={handleChangeTotals}
              totals={{
                itemCount: totals.itemCount,
                originalTotal: totals.originalTotal,
                productDiscount: totals.productDiscount,
                subTotal: totals.subTotal,
                taxTotal: totals.taxTotal,
                grandTotal: totals.grandTotal,
                payable: totals.payable,
                bulkDiscountTotal: totals.bulkDiscountTotal,
                comboDiscountTotal: totals.comboDiscountTotal,
                cartWideDiscount: totals.cartWideDiscount,
                couponDiscount: data.couponDiscount,
              }}
              onSubmit={handleSubmitProducts}
            />
          </div>

          <div className="space-y-6 lg:col-span-4">
            <SidebarInfoCard
              name={data.customerInfo.name}
              phone={data.customerInfo.phone}
              email={data.customerInfo.email}
              address={data.customerInfo.address}
            />

            <SidebarCourierCard
              method={data.courier.method}
              consignmentId={data.courier.consignmentId}
              trackingUrl={data.courier.trackingUrl}
              lastUpdatedAtLabel={formatDateTimeLabel(
                data.courier.lastUpdatedAt,
              )}
              anyAutoAvailable={courierOption?.any_auto_available}
              providers={courierOption?.available_providers}
              balanceByProvider={balanceByProvider}
              weightKg={data.weightKgTotal || 1}
              onChange={handleCourierChange}
              onSendAuto={handleCourierSendAuto}
              onSendManual={handleCourierSendManual}
              onComplete={handleCourierComplete}
              onDownloadInvoice={handleCourierInvoice}
              onSyncStatus={handleSyncStatus}
              syncingStatus={syncingStatus}
              dispatchResult={dispatchResult}
              onClearResult={() => setDispatchResult(null)}
            />

            <SidebarCustomerHistoryCard
              orderId={data.customerHistory.orderId}
              shipping={data.customerHistory.shipping}
              orderDateLabel={formatDateLabel(data.customerHistory.orderDate)}
              totalAmount={data.customerHistory.totalAmount}
              timeAgo={data.customerHistory.timeAgo}
              orderStatus={data.customerHistory.orderStatus}
              sentBy={data.customerHistory.sentBy}
              additionalNotes={data.customerHistory.additionalNotes}
              onDownloadInvoice={handleInvoiceDownload}
            />

            {/* <SidebarShippingStickerCard
              onOpenGenerator={handleOpenStickerGenerator}
            /> */}

            <OrderRefundPanel
              orderId={Number(data.orderId)}
              isLocked={(LOCKED_STATUSES as readonly string[]).includes(data.orderStatus)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditorPage;
