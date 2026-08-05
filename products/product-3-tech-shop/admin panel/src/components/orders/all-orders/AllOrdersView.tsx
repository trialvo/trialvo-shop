import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { keepPreviousData, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";


import OrdersTable from "./OrdersTable";
import OrderFiltersBar from "./OrderFiltersBar";
import BulkDispatchModal from "./BulkDispatchModal";
import { Pagination } from "@/components/ui";

import type { OrderRow, OrderStatus, OrderItemRow, FraudCheckSummary, FraudLevel } from "./types";
import {
  FRAUD_OPTIONS,
  ORDER_TYPE_OPTIONS,
  PAYMENT_PROVIDER_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  STATUS_OPTIONS,
} from "./orderData";

import { getAdminOrders, getOrderEventVersion, ordersKeys, bulkSyncCourierStatus, type ApiOrder } from "@/api/orders.api";
import { toPublicUrl } from "@/utils/toPublicUrl";

function nowLabel() {
  const d = new Date();
  const date = d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} at ${time} `;
}

function formatOrderDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function formatOrderTimeLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function timeAgoLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function timeAgoLabelI18n(iso: string, t: (key: string, opts?: any) => string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("orders.justNow");
  if (mins < 60) return t("orders.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("orders.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  return t("orders.daysAgo", { count: days });
}

const FRAUD_CANCEL_THRESHOLD = 0.4;
const FRAUD_SAFE_THRESHOLD = 0.8;

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function parseFraudResults(raw: unknown): FraudCheckSummary | null {
  if (raw === null || raw === undefined || raw === "") return null;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (err: any) {
      return {
        success: false,
        status: "not_found",
        totalParcels: 0,
        totalDelivered: 0,
        totalCancel: 0,
        deliveryRatio: null,
        cancelRatio: null,
        systemNote: "Invalid fraud check response",
        providers: [],
      };
    }
  }

  if (!parsed || typeof parsed !== "object") return null;

  const success = Boolean(parsed.success);
  const totalParcels = toNumber(parsed.total_parcels);
  const totalDelivered = toNumber(parsed.total_delivered);
  const totalCancel = toNumber(parsed.total_cancel);

  const deliveryRatio = totalParcels > 0 ? clamp01(totalDelivered / totalParcels) : null;
  const cancelRatio = totalParcels > 0 ? clamp01(totalCancel / totalParcels) : null;

  let status: FraudLevel = "medium";
  if (!success || totalParcels <= 0) status = "not_found";
  else if ((cancelRatio ?? 0) >= FRAUD_CANCEL_THRESHOLD) status = "high";
  else if ((deliveryRatio ?? 0) >= FRAUD_SAFE_THRESHOLD) status = "safe";
  else status = "medium";

  const apis = parsed.apis && typeof parsed.apis === "object" ? parsed.apis : {};
  const providers = Object.entries(apis).map(([key, value]) => {
    const stats = value as any;
    const total = toNumber(stats?.total_parcels);
    const delivered = toNumber(stats?.total_delivered_parcels);
    const cancelled = toNumber(stats?.total_cancelled_parcels);
    return {
      id: key,
      name: stats?.courier_name || key,
      total,
      delivered,
      cancelled,
      ratio: total > 0 ? clamp01(delivered / total) : null,
      status: stats?.status ?? null,
    };
  });

  return {
    success,
    status,
    mobileNumber: parsed.mobile_number,
    totalParcels,
    totalDelivered,
    totalCancel,
    deliveryRatio,
    cancelRatio,
    systemNote: parsed.system_note,
    checkedAt: parsed.checked_at,
    providers,
  };
}

function paymentMethodFromApi(paymentType: ApiOrder["payment_type"], providerGuess?: string) {
  if (paymentType === "cod") return "COD";
  const p = (providerGuess || "").toLowerCase();
  if (p === "bkash") return "BKASH";
  if (p === "nagad") return "NAGAD";
  if (p === "rocket") return "ROCKET";
  return "CARD";
}

function providerGuessFromPayments(payments: ApiOrder["payments"]) {
  const last = [...(payments ?? [])].reverse().find((x) => x?.provider);
  return last?.provider ?? "";
}

function mapApiItemsToRowItems(items: any[]): OrderItemRow[] {
  if (!Array.isArray(items)) return [];

  return items.map((it) => {
    const name = (it?.product_name ?? "").trim() || "—";
    const img = it?.product_image ? toPublicUrl(it.product_image) : null;

    const qty = Number(it?.quantity ?? 0) || 0;

    const unitPrice = Number(it?.final_unit_price ?? it?.selling_price ?? 0) || 0;
    const lineTotal = Number(it?.line_total ?? unitPrice * qty) || 0;

    return {
      id: String(it?.id ?? `${it?.order_id ?? "x"} -${it?.product_id ?? "p"} -${it?.product_sku_id ?? "s"} `),

      productId: typeof it?.product_id === "number" ? it.product_id : undefined,
      skuId: typeof it?.product_sku_id === "number" ? it.product_sku_id : undefined,

      name,
      image: img,

      brandName: it?.brand_name ?? null,

      colorName: it?.color_name ?? null,
      colorHex: it?.color_hex ?? null,

      size: it?.variant_name ?? null,
      code: it?.sku ?? null,

      qty,

      price: unitPrice,
      total: lineTotal,
    };
  });
}

type AllOrdersViewProps = {
  defaultOrderType?: "all" | "regular" | "guest" | "admin_regular" | "admin_stranger" | "single_page";
};

export default function AllOrdersView({ defaultOrderType = "all" }: AllOrdersViewProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<OrderStatus>("new");
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDispatchOpen, setBulkDispatchOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [orderType, setOrderType] = useState<"all" | "regular" | "guest" | "admin_regular" | "admin_stranger" | "single_page">(defaultOrderType);

  const [paymentStatus, setPaymentStatus] = useState<"all" | "unpaid" | "partial_paid" | "paid">(
    "all"
  );

  const [paymentType, setPaymentType] = useState<"all" | "gateway" | "cod" | "mixed">("all");

  const [paymentProvider, setPaymentProvider] = useState<
    "all" | "sslcommerz" | "bkash" | "nagad" | "shurjopay" | "rocket"
  >("all");

  const [fraud, setFraud] = useState<"all" | "0" | "1">("all");

  const [minTotal, setMinTotal] = useState<string>("");
  const [maxTotal, setMaxTotal] = useState<string>("");

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  // V2-017: Assigned to Me filter
  const [assignedToMe, setAssignedToMe] = useState<boolean>(false);
  // Filter by a specific admin
  const [assignedAdminId, setAssignedAdminId] = useState<number | null>(null);

  const { admin } = useAuth();
  const currentAdminId = admin?.id ?? null;

  // ── Deep-link: open specific order modal from ?orderId=X ──────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkOrderId = searchParams.get("orderId") ?? undefined;

  const [refreshedAt, setRefreshedAt] = useState(nowLabel());

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setCustomerPhone("");
      setCustomerEmail("");
      return;
    }
    if (q.includes("@")) {
      setCustomerEmail(q);
      setCustomerPhone("");
      return;
    }
    setCustomerPhone(q);
    setCustomerEmail("");
  }, [search]);

  const listParams = useMemo(() => {
    return {
      order_type: orderType === "all" ? undefined : orderType,
      customer_phone: customerPhone || undefined,
      customer_email: customerEmail || undefined,

      order_status: status === "all" ? undefined : status,
      payment_status: paymentStatus === "all" ? undefined : paymentStatus,
      payment_provider: paymentProvider === "all" ? undefined : paymentProvider,
      payment_type: paymentType === "all" ? undefined : paymentType,

      is_fraud: fraud === "all" ? undefined : fraud,
      min_total: minTotal ? Number(minTotal) : undefined,
      max_total: maxTotal ? Number(maxTotal) : undefined,

      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,

      assigned_to_me: assignedToMe || undefined,
      assigned_to_admin_id: assignedAdminId ?? undefined,

      limit,
      offset,
    };
  }, [
    orderType,
    customerPhone,
    customerEmail,
    status,
    paymentStatus,
    paymentProvider,
    paymentType,
    fraud,
    minTotal,
    maxTotal,
    dateFrom,
    dateTo,
    assignedToMe,
    assignedAdminId,
    limit,
    offset,
  ]);

  // ── Version-gated polling ──────────────────────────────────────────────────
  // Instead of 13+ heavy queries every 30s, we poll a single lightweight
  // counter endpoint every 10s and only invalidate when something changes.
  const lastVersionRef = useRef<number | null>(null);

  const versionQuery = useQuery({
    queryKey: ["order-event-version"],
    queryFn: getOrderEventVersion,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    staleTime: 5_000,
  });

  useEffect(() => {
    const v = versionQuery.data;
    if (v === undefined) return; // still loading

    // First load — just store the version, don't invalidate
    if (lastVersionRef.current === null) {
      lastVersionRef.current = v;
      return;
    }

    // Version changed — invalidate all order queries
    if (v !== lastVersionRef.current) {
      lastVersionRef.current = v;
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      setRefreshedAt(nowLabel());
    }
  }, [versionQuery.data, queryClient]);
  // ────────────────────────────────────────────────────────────────────────────

  const ordersQuery = useQuery({
    queryKey: ordersKeys.list(listParams),
    queryFn: () => getAdminOrders(listParams),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  // Separate unfiltered query just for global summary (not affected by any filters)
  const summaryQuery = useQuery({
    queryKey: ordersKeys.list({ limit: 1, offset: 0 }),
    queryFn: () => getAdminOrders({ limit: 1, offset: 0 }),
    retry: 1,
    staleTime: 30_000,
  });

  // Global counts per status — NOT affected by any filters
  const countQueries = useQueries({
    queries: STATUS_OPTIONS.filter((x) => x.id !== "all").map((opt) => ({
      queryKey: ordersKeys.list({
        order_status: opt.id,
        limit: 1,
        offset: 0,
      }),
      queryFn: () =>
        getAdminOrders({
          order_status: opt.id,
          limit: 1,
          offset: 0,
        }),
      enabled: true,
      retry: 1,
      staleTime: 30_000,
    })),
  });

  const counts = useMemo(() => {
    const base: Record<OrderStatus, number> = {
      all: summaryQuery.data?.summary?.total ?? summaryQuery.data?.pagination?.total ?? 0,

      new: 0,
      approved: 0,
      processing: 0,
      packaging: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
      on_hold: 0,
      trash: 0,
    };

    STATUS_OPTIONS.filter((x) => x.id !== "all").forEach((opt, idx) => {
      const q = countQueries[idx];
      const total = q?.data?.pagination?.total;
      if (typeof total === "number") base[opt.id as Exclude<OrderStatus, "all">] = total;
    });

    return base;
  }, [summaryQuery.data, countQueries]);

  const rows: OrderRow[] = useMemo(() => {
    const data = ordersQuery.data?.data ?? [];
    const courierOption = ordersQuery.data?.courierOption;

    return data.map((o: any) => {
      const providerGuess = providerGuessFromPayments(o.payments);
      const method = paymentMethodFromApi(o.payment_type, providerGuess);

      const apiItems = Array.isArray(o.items) ? o.items : [];
      const rowItems = mapApiItemsToRowItems(apiItems);

      const itemsCount = rowItems.length;
      const qtyCount = rowItems.reduce((s, it) => s + (Number(it.qty) || 0), 0);

      const mainCourier = (o.couriers ?? [])[0];
      const courierProvider = (mainCourier?.courier_provider || "").toLowerCase();

      const autoList =
        courierOption?.available_providers?.map((p: any, idx: number) => ({
          providerId: (String(p.provider || "").toLowerCase() as any),
          providerName: p.provider,
          connected: Number(p.is_auto_available) === 1,
          isDefault: idx === 0,
          image: p.image || null,
        })) ?? [];

      const apiConnected = autoList.some((x: any) => x.providerId === courierProvider && x.connected);

      const fraudCheck = parseFraudResults(o.fraud_test_results);
      const fraudLevel: FraudLevel = fraudCheck ? fraudCheck.status : o.is_fraud ? "high" : "safe";

      const zone = o.area_name
        ? `${o.lm_city_name || o.city} — ${o.area_name}`
        : (o.city ?? "");
      const shippingLocation = `${zone} ${o.full_address ?? ""}`.trim() || "—";

      return {
        id: String(o.id),

        customerName: (o.customer_name || "").trim() || "—",
        customerPhone: o.customer_phone || "—",

        customerImage: toPublicUrl(o.customer_img ?? null) ?? undefined,

        fraudLevel,
        fraudCheck: fraudCheck ?? undefined,

        paymentMethod: method,
        paymentStatus: o.payment_status,

        status: o.order_status,
        orderType: o.order_type ?? undefined,

        itemsAmount: itemsCount,
        totalItems: qtyCount,
        total: Number(o.grand_total ?? 0),
        currencySymbol: "৳",

        orderDateLabel: formatOrderDateLabel(o.created_at),
        orderTimeLabel: formatOrderTimeLabel(o.created_at),
        relativeTimeLabel: timeAgoLabel(o.created_at),

        orderNote: o.note ?? undefined,

        shippingLocation,
        shippingAddress: `${o.full_address ?? ""}`.trim() || "—",
        shippingArea: o.area_name
          ? `${o.lm_city_name || o.city} — ${o.area_name}`
          : (`${o.city ?? ""}`.trim() || "—"),

        email: o.customer_email ?? undefined,

        paidAmount: Number(o.paid_amount ?? 0),
        shippingCost: Number(o.delivery_charge ?? 0),
        discount: Number(o.discount_total ?? 0),
        // Individual discount breakdown — all directly from stored DB columns
        bulkDiscount: Number(o.bulk_discount_total ?? 0),
        comboDiscount: Number(o.combo_discount_total ?? 0),
        cartWideDiscount: Number(o.cart_wide_discount ?? 0),
        couponDiscount: Number(o.coupon_discount ?? 0),
        skuDiscount: Number(o.sku_discount_total ?? 0),
        dueAmount: Number(o.due_amount ?? 0),
        weightKgTotal: Number(o.weight_kg_total ?? 0),
        weightExtraCharge: Number(o.weight_extra_charge ?? 0),

        paymentType: o.payment_type,
        paymentProvider: providerGuess,

        items: rowItems,

        courier: {
          providerId: (courierProvider as any) || (mainCourier ? "manual" : "select"),
          providerName: mainCourier?.courier_provider ?? undefined,
          memoNo: mainCourier?.memo ?? undefined,
          trackingNo: mainCourier?.tracking_number ?? undefined,
          apiConfigured: Boolean(courierOption?.any_auto_available),
          apiConnected,
          availableAutoCouriers: autoList as any,
          preview: {
            receiverName: o.customer_name || undefined,
            receiverPhone: o.customer_phone || undefined,
            address: `${o.full_address ?? ""}`.trim() || "—",
            area: o.area_name
              ? `${o.lm_city_name || o.city} — ${o.area_name}`
              : (`${o.city ?? ""}`.trim() || "—"),
            codAmount: o.payment_type === "cod" ? Number(o.grand_total ?? 0) : 0,
            weightKg:
              (mainCourier?.weight != null && Number(mainCourier.weight) > 0)
                ? Number(mainCourier.weight)
                : Number(o.weight_kg_total ?? 0) || 0,
          },
        },

        // V2-017: Assignment fields
        assignedToAdminId: o.assigned_to_admin_id ?? null,
        assignedAdminName: o.assigned_admin_name ?? null,
        assignedAdminEmail: o.assigned_admin_email ?? null,
        assignedAdminImg: o.assigned_admin_img ? toPublicUrl(o.assigned_admin_img) ?? null : null,
        assignmentMethod: o.assignment_method ?? null,
        isAssignedToMe: currentAdminId !== null && o.assigned_to_admin_id === currentAdminId,
      };
    });
  }, [ordersQuery.data, ordersQuery.data?.courierOption, currentAdminId]);

  const pagination = ordersQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = offset + 1;

  useEffect(() => {
    if (!ordersQuery.isSuccess) return;
    setRefreshedAt(nowLabel());
  }, [ordersQuery.dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const onClear = () => {
    setStatus("new");
    setSearch("");
    setOrderType("all");
    setPaymentStatus("all");
    setPaymentType("all");
    setPaymentProvider("all");
    setFraud("all");
    setMinTotal("");
    setMaxTotal("");
    setDateFrom("");
    setDateTo("");
    setAssignedToMe(false);
    setAssignedAdminId(null);
    setLimit(20);
    setOffset(0);
    setSelectedIds(new Set());
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && rows.length > 0) {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const onRefresh = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      setRefreshedAt(nowLabel());
      toast.success(t("orders.ordersRefreshed"));
    } catch {
      toast.error(t("orders.failedRefresh"));
    }
  };

  const [bulkSyncing, setBulkSyncing] = useState(false);
  const onBulkSync = async () => {
    if (bulkSyncing) return;
    setBulkSyncing(true);
    try {
      const result = await bulkSyncCourierStatus();
      if (result.updated > 0) {
        // refetchQueries (not invalidateQueries) to force immediate active refetch
        await queryClient.refetchQueries({ queryKey: ordersKeys.lists(), type: "active" });
        setRefreshedAt(nowLabel());
        toast.success(`✓ Synced: ${result.updated} updated of ${result.checked} checked`);
      } else {
        toast(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Bulk sync failed");
    } finally {
      setBulkSyncing(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: title + metric pills */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            {([
              { label: t("orders.total"), value: summaryQuery.data?.summary?.total ?? counts.all, dot: "bg-gray-800 dark:bg-gray-300", valueColor: "text-gray-900 dark:text-white" },
              { label: t("orders.newOrders", "New"), value: summaryQuery.data?.summary?.new ?? counts.new, dot: "bg-brand-500", valueColor: "text-brand-600 dark:text-brand-400" },
              { label: t("orders.complete"), value: summaryQuery.data?.summary?.delivered ?? counts.delivered, dot: "bg-success-500", valueColor: "text-success-600 dark:text-success-400" },
              { label: t("orders.cancelled"), value: summaryQuery.data?.summary?.cancelled ?? counts.cancelled, dot: "bg-error-500", valueColor: "text-error-600 dark:text-error-400" },
              { label: t("orders.others", "Others"), value: summaryQuery.data?.summary?.others ?? 0, dot: "bg-gray-300 dark:bg-gray-600", valueColor: "text-gray-500 dark:text-gray-400" },
            ] as const).map((x) => (
              <div
                key={x.label}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition-shadow hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${x.dot}`} />
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{x.label}</span>
                <span className={`text-[15px] font-bold tabular-nums leading-none ${x.valueColor}`}>{x.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: sync-all + refresh + live indicator */}
        <div className="flex items-center gap-2 self-start">
          {/* Sync All Courier Status */}
          <button
            type="button"
            onClick={onBulkSync}
            disabled={bulkSyncing}
            title="Sync all courier statuses from courier APIs"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
          >
            <RefreshCw size={12} className={bulkSyncing ? "animate-spin" : undefined} />
            <span className="hidden sm:inline">{bulkSyncing ? "Syncing…" : "Sync All Status"}</span>
          </button>

          {/* Live indicator + manual refresh */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
            </span>
            <span className="hidden text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:inline">
              Live
            </span>
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <span className="hidden text-[11px] text-gray-400 dark:text-gray-500 sm:inline">
            {refreshedAt}
          </span>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
              onClick={onRefresh}
              aria-label="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <OrderFiltersBar
        status={status}
        setStatus={(s) => {
          setStatus(s);
          setOffset(0);
        }}
        counts={counts}
        statusOptions={STATUS_OPTIONS}
        search={search}
        setSearch={(v) => {
          setSearch(v);
          setOffset(0);
        }}
        orderType={orderType}
        setOrderType={(v) => {
          setOrderType(v);
          setOffset(0);
        }}
        paymentStatus={paymentStatus}
        setPaymentStatus={(v) => {
          setPaymentStatus(v);
          setOffset(0);
        }}
        paymentType={paymentType}
        setPaymentType={(v) => {
          setPaymentType(v);
          setOffset(0);
        }}
        paymentProvider={paymentProvider}
        setPaymentProvider={(v) => {
          setPaymentProvider(v);
          setOffset(0);
        }}
        fraud={fraud}
        setFraud={(v) => {
          setFraud(v);
          setOffset(0);
        }}
        minTotal={minTotal}
        setMinTotal={(v) => {
          setMinTotal(v);
          setOffset(0);
        }}
        maxTotal={maxTotal}
        setMaxTotal={(v) => {
          setMaxTotal(v);
          setOffset(0);
        }}
        dateFrom={dateFrom}
        setDateFrom={(v) => {
          setDateFrom(v);
          setOffset(0);
        }}
        dateTo={dateTo}
        setDateTo={(v) => {
          setDateTo(v);
          setOffset(0);
        }}
        limit={limit}
        setLimit={(v) => {
          setLimit(v);
          setOffset(0);
        }}
        onClear={onClear}
        uiOptions={{
          orderType: ORDER_TYPE_OPTIONS,
          paymentStatus: PAYMENT_STATUS_OPTIONS,
          paymentType: PAYMENT_TYPE_OPTIONS,
          paymentProvider: PAYMENT_PROVIDER_OPTIONS,
          fraud: FRAUD_OPTIONS,
        }}
        loading={ordersQuery.isFetching}
        assignedToMe={assignedToMe}
        setAssignedToMe={(v) => {
          setAssignedToMe(v);
          if (v) setAssignedAdminId(null);
          setOffset(0);
        }}
        assignedAdminId={assignedAdminId}
        setAssignedAdminId={(v) => {
          setAssignedAdminId(v);
          if (v !== null) setAssignedToMe(false);
          setOffset(0);
        }}
      />

      {/* Table */}
      <OrdersTable 
        rows={rows} 
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        defaultOpenOrderId={deepLinkOrderId}
        onDeepLinkConsumed={() => {
          // Remove the orderId param so refreshing doesn't re-open the modal
          setSearchParams((prev) => { prev.delete("orderId"); return prev; }, { replace: true });
        }}
      />

      {/* Floating Action Bar */}
        {selectedIds.size > 0 && (
          <div
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                {selectedIds.size}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Orders selected
              </span>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
            <button
              onClick={() => setBulkDispatchOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Bulk Dispatch
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          </div>
        )}
      <BulkDispatchModal
        open={bulkDispatchOpen}
        onClose={() => setBulkDispatchOpen(false)}
        selectedIds={Array.from(selectedIds)}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Pagination */}
      <Pagination
        totalItems={total}
        page={currentPage}
        pageSize={limit}
        onPageChange={(nextPage) => setOffset(Math.max(0, nextPage - 1))}
        onPageSizeChange={(nextPageSize) => {
          setLimit(nextPageSize);
          setOffset(0);
        }}
        pageSizeOptions={[5, 10, 20, 50]}
        className="shadow-none"
      />
    </div>
  );
}
