import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  Eye,
  PackageSearch,
  Pencil,
  Printer,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import type { CourierProviderId, OrderRow } from "./types";
import SendCourierCell from "./SendCourierCell";
import StatusHistoryPopover from "./StatusHistoryPopover";
import OrderSelectDropdown from "@/components/ui/dropdown/OrderSelectDropdown";
import OrderInfoModal from "@/components/ui/modal/OrderInfoModal";
import FraudCheckModal from "@/components/ui/modal/FraudCheckModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { imageFallbackSvgDataUri } from "@/utils/imageFallback";
import { toPublicUrl } from "@/utils/toPublicUrl";

import {
  ordersKeys,
  patchOrderPaymentStatus,
  patchOrderStatus,
} from "@/api/orders.api";

type Props = {
  rows: OrderRow[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  /** Order ID to auto-open in modal (from ?orderId= URL param) */
  defaultOpenOrderId?: string;
  /** Called once the deep-link modal has been opened so the parent can clear the URL param */
  onDeepLinkConsumed?: () => void;
};

// ─── Shell (matches AllProductsTable / SectionCard) ───────────────────────────

const tableShellClass = cn(
  "w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white",
  "border border-gray-100",
  "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)]",
  "transition-shadow duration-300 ease-out",
  "dark:border-gray-800 dark:bg-gray-900",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]",
);

const headerCellBaseClass =
  "px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400";

const stickyActionHeaderClass = cn(
  "sticky right-0 z-40",
  "w-[1%] whitespace-nowrap",
  "border-l border-gray-200 bg-gray-100",
  "shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.08)]",
  "dark:border-gray-700 dark:bg-gray-800",
  "dark:shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.4)]",
);

const stickyActionCellClass = cn(
  "sticky right-0 z-20",
  "w-[1%] whitespace-nowrap",
  "border-l border-gray-100 bg-white",
  "group-hover:bg-gray-50",
  "transition-colors duration-150",
  "dark:border-gray-800 dark:bg-gray-900 dark:group-hover:bg-gray-800/80",
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fraudIcon(level: OrderRow["fraudLevel"]) {
  if (level === "safe")     return <CheckCircle2 size={14} className="text-success-500" />;
  if (level === "medium")   return <AlertTriangle size={14} className="text-orange-500" />;
  if (level === "not_found") return <HelpCircle size={14} className="text-gray-400" />;
  return <ShieldAlert size={14} className="text-error-500" />;
}

function fraudLabel(level: OrderRow["fraudLevel"]) {
  if (level === "safe")      return "Safe";
  if (level === "medium")    return "Medium";
  if (level === "not_found") return "Not Found";
  return "Fraud";
}

function getErrorMessage(err: unknown, fallback: string) {
  const e = err as Record<string, unknown>;
  const data = e?.response as Record<string, unknown> | undefined;
  return (
    (data?.data as Record<string, unknown>)?.error as string ??
    (data?.data as Record<string, unknown>)?.message as string ??
    e?.message as string ??
    fallback
  );
}

const PAYMENT_OPTIONS = [
  { id: "paid",         label: "Paid" },
  { id: "partial_paid", label: "Partial Paid" },
  { id: "unpaid",       label: "Unpaid" },
] as const;

const STATUS_OPTIONS = [
  { id: "new",             label: "New" },
  { id: "approved",        label: "Approved" },
  { id: "processing",      label: "Processing" },
  { id: "packaging",       label: "Packaging" },
  { id: "shipped",         label: "Shipped" },
  { id: "out_for_delivery", label: "Out For Delivery" },
  { id: "delivered",       label: "Delivered" },
  { id: "returned",        label: "Returned" },
  { id: "cancelled",       label: "Cancelled" },
  { id: "on_hold",         label: "On Hold" },
  { id: "trash",           label: "Trash" },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrdersTable({ rows, selectedIds, onSelect, onSelectAll, defaultOpenOrderId, onDeepLinkConsumed }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentOverride, setPaymentOverride] = useState<
    Record<string, OrderRow["paymentStatus"]>
  >({});
  const [statusOverride, setStatusOverride] = useState<
    Record<string, OrderRow["status"]>
  >({});

  const [courierOverride, setCourierOverride] = useState<
    Record<string, { providerId?: CourierProviderId; memoNo?: string }>
  >({});

  const [viewOpen, setViewOpen]         = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [fraudOpen, setFraudOpen]       = useState(false);
  const [fraudOrder, setFraudOrder]     = useState<OrderRow | null>(null);

  // ── Deep-link: auto-open order modal when ?orderId= is present ─────────────
  const consumedRef = useRef(false);
  useEffect(() => {
    if (!defaultOpenOrderId || consumedRef.current || rows.length === 0) return;
    const targetRow = rows.find((r) => String(r.id) === String(defaultOpenOrderId));
    if (targetRow) {
      consumedRef.current = true;
      setSelectedOrder(targetRow);
      setViewOpen(true);
      onDeepLinkConsumed?.();
    }
  }, [defaultOpenOrderId, rows, onDeepLinkConsumed]);

  const mergedRows = useMemo(() =>
    rows.map((r) => ({
      ...r,
      paymentStatus: paymentOverride[r.id] ?? r.paymentStatus,
      status:        statusOverride[r.id]  ?? r.status,
    })),
    [rows, paymentOverride, statusOverride]
  );

  const openView  = (order: OrderRow) => { setSelectedOrder(order); setViewOpen(true); };
  const openFraud = (order: OrderRow) => { setFraudOrder(order);    setFraudOpen(true); };

  const updateCourier = (orderId: string, providerId: CourierProviderId, memoNo: string) => {
    setCourierOverride((prev) => ({ ...prev, [orderId]: { providerId, memoNo } }));
  };

  const requestCourier = async (
    orderId: string,
    providerId: Exclude<CourierProviderId, "select">
  ) => {
    // eslint-disable-next-line no-console
    console.log("Request courier for:", orderId, "provider:", providerId);
  };

  const paymentMutation = useMutation({
    mutationFn: async (payload: { orderId: number; newStatus: "unpaid" | "partial_paid" | "paid" }) =>
      patchOrderPaymentStatus(payload.orderId, payload.newStatus),
    onSuccess: async () => {
      toast.success(t("orders.paymentStatusUpdated"));
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
      // Payment status affects settlement; refresh pool counts too
      queryClient.invalidateQueries({ queryKey: ["distribution-eligible-admins"] });
      queryClient.invalidateQueries({ queryKey: ["distribution-agents"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update payment status"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: {
      orderId: number;
      newStatus: OrderRow["status"];
      previousStatus: OrderRow["status"];
    }) => patchOrderStatus(payload.orderId, payload.newStatus),
    onMutate: (payload) => {
      const key = String(payload.orderId);
      setStatusOverride((prev) => ({ ...prev, [key]: payload.newStatus }));
      return { key, previousStatus: payload.previousStatus };
    },
    onSuccess: async (_data, variables) => {
      const key = String(variables.orderId);
      setStatusOverride((prev) => { const next = { ...prev }; delete next[key]; return next; });
      toast.success(t("orders.orderStatusUpdated"));
      await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
      // When order status becomes terminal (delivered/cancelled/returned) the active_order_count
      // in the distribution pool must decrease — invalidate those caches immediately.
      queryClient.invalidateQueries({ queryKey: ["distribution-eligible-admins"] });
      queryClient.invalidateQueries({ queryKey: ["distribution-agents"] });
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.key) {
        setStatusOverride((prev) => ({ ...prev, [context.key]: context.previousStatus }));
      }
      toast.error(getErrorMessage(err, "Failed to update order status"));
    },
  });

  return (
    <>
      <div className={tableShellClass}>
        <div
          className={cn("relative w-full max-w-full min-w-0 overflow-x-auto overflow-auto", "min-h-[500px] max-h-[calc(100vh-350px)]")}
        >
          <Table className="min-w-[1400px] border-collapse">
            {/* ── Header ── */}
            <TableHeader>
              <TableRow className="border-b-2 border-gray-200 bg-gray-100 shadow-[0_2px_8px_-2px_rgba(16,24,40,0.10)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)]">
                <TableCell isHeader className={cn(headerCellBaseClass, "w-[52px] text-center")}>#</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[200px]")}>Customer</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[200px]")}>Order Info</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[160px]")}>Amount</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[150px]")}>Payment</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[160px]")}>Status</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[140px]")}>Date &amp; Time</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[220px]")}>Send Courier</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[180px]")}>Order Note</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[200px]")}>Shipping Location</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[180px]")}>Assigned Admin</TableCell>
                <TableCell isHeader className={cn(headerCellBaseClass, "min-w-[120px]")}>Status History</TableCell>
                <TableCell
                  isHeader
                  className={cn(stickyActionHeaderClass, headerCellBaseClass, "min-w-[100px] text-right")}
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* ── Body ── */}
            <TableBody>
              {mergedRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={13} className="px-4 py-20">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-2xl",
                        "bg-gray-100 dark:bg-gray-800",
                      )}>
                        <PackageSearch className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No orders found</p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Try adjusting your filters.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                mergedRows.map((r, i) => {
                  const fallback = imageFallbackSvgDataUri(r.customerName);
                  const imageSrc = r.customerImage ? toPublicUrl(r.customerImage) : fallback;

                  return (
                    <TableRow
                      key={r.id}
                      className={cn(
                        "group border-b border-gray-100/80",
                        "transition-colors duration-150",
                        "hover:bg-gray-50/60",
                        "dark:border-gray-800/80 dark:hover:bg-white/[0.02]",
                      )}
                    >
                      {/* Serial */}
                      <TableCell className="px-4 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-md",
                          "text-xs font-semibold",
                          "bg-gray-100 text-gray-500",
                          "dark:bg-gray-800 dark:text-gray-400",
                        )}>
                          {i + 1}
                        </span>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={cn(
                            "relative flex h-10 w-10 shrink-0 items-center justify-center",
                            "overflow-hidden rounded-full",
                            "border border-gray-200/80 bg-gray-100",
                            "dark:border-gray-700/60 dark:bg-gray-800",
                          )}>
                            <img
                              src={imageSrc}
                              alt={r.customerName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src !== fallback) target.src = fallback;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[160px] truncate text-sm font-semibold text-brand-500">{r.customerName}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.customerPhone}</p>
                            <button
                              type="button"
                              onClick={() => openFraud(r)}
                              className={cn(
                                "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                                "text-[11px] font-semibold",
                                "bg-white ring-1 ring-gray-200 text-gray-600",
                                "hover:bg-gray-50 transition-colors duration-150",
                                "dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]",
                              )}
                            >
                              {fraudIcon(r.fraudLevel)}
                              <span className="truncate">Fraud: {fraudLabel(r.fraudLevel)}</span>
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      {/* Order Info */}
                      <TableCell className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">#{r.id}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.orderDateLabel} · {r.orderTimeLabel}</p>
                          <p className="truncate text-xs font-medium text-gray-400 dark:text-gray-500">{r.relativeTimeLabel}</p>
                          {r.orderType && (
                            <span className={cn(
                              "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              r.orderType === "regular"         && "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                              r.orderType === "guest"           && "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
                              r.orderType === "admin_regular"   && "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                              r.orderType === "admin_stranger"  && "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
                              r.orderType === "single_page"     && "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
                            )}>
                              {r.orderType === "admin_regular" ? "Admin" : r.orderType === "admin_stranger" ? "Admin-S" : r.orderType === "single_page" ? "Single" : r.orderType === "guest" ? "Guest" : "Regular"}
                            </span>
                          )}
                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openView(r)}
                              aria-label="View order"
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                "border border-gray-200 bg-gray-50 text-gray-600",
                                "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600",
                                "active:scale-95 transition-all duration-150",
                                "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
                                "dark:hover:border-brand-500/50 dark:hover:bg-brand-500/15 dark:hover:text-brand-300",
                              )}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/order-editor?orderId=${encodeURIComponent(r.id)}`)}
                              aria-label="Edit order"
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                "border border-gray-200 bg-gray-50 text-gray-600",
                                "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600",
                                "active:scale-95 transition-all duration-150",
                                "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
                                "dark:hover:border-brand-500/50 dark:hover:bg-brand-500/15 dark:hover:text-brand-300",
                              )}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="px-4 py-3.5">
                        <div className="leading-snug">
                          <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                            {r.currencySymbol}{r.total}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            Items: {r.itemsAmount} · Qty: {r.totalItems}
                          </p>
                          <p className="truncate text-xs font-semibold text-brand-500">{r.paymentMethod}</p>
                        </div>
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell className="px-4 py-3.5">
                        <OrderSelectDropdown
                          value={r.paymentStatus}
                          onChange={(v) => {
                            const next = v as OrderRow["paymentStatus"];
                            setPaymentOverride((prev) => ({ ...prev, [r.id]: next }));
                            paymentMutation.mutate({ orderId: Number(r.id), newStatus: next });
                          }}
                          options={PAYMENT_OPTIONS as unknown as { id: string; label: string }[]}
                          variant="pill"
                        />
                      </TableCell>

                      {/* Order Status */}
                      <TableCell className="px-4 py-3.5">
                        <OrderSelectDropdown
                          value={r.status}
                          onChange={(v) => {
                            const next = v as OrderRow["status"];
                            statusMutation.mutate({ orderId: Number(r.id), newStatus: next, previousStatus: r.status });
                          }}
                          options={STATUS_OPTIONS as unknown as { id: string; label: string }[]}
                          variant="pill"
                        />
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell className="px-4 py-3.5">
                        <p className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{r.orderDateLabel}</p>
                        <p className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{r.orderTimeLabel}</p>
                      </TableCell>

                      {/* Send Courier */}
                      <TableCell className="px-4 py-3.5">
                        <SendCourierCell
                          order={r}
                          courierOverride={courierOverride[r.id]}
                          onUpdateCourier={updateCourier}
                          onRequestCourier={requestCourier}
                        />
                      </TableCell>

                      {/* Order Note */}
                      <TableCell className="px-4 py-3.5">
                        <p className="max-w-[160px] truncate text-sm text-gray-600 dark:text-gray-300">
                          {r.orderNote || "—"}
                        </p>
                      </TableCell>

                      {/* Shipping */}
                      <TableCell className="px-4 py-3.5">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{r.shippingArea}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.shippingAddress}</p>
                      </TableCell>

                      {/* ── Assigned Admin ──────────────────────────── */}
                      <TableCell className="px-4 py-3.5">
                        {r.assignedToAdminId ? (
                          <div className="flex min-w-0 items-center gap-2.5">
                            {/* Avatar */}
                            <div className={cn(
                              "relative h-8 w-8 shrink-0 overflow-hidden rounded-full",
                              "border-2 ring-1 ring-white dark:ring-gray-900",
                              r.isAssignedToMe
                                ? "border-brand-400"
                                : "border-gray-200 dark:border-gray-700",
                            )}>
                              <img
                                src={r.assignedAdminImg ?? imageFallbackSvgDataUri(r.assignedAdminName ?? "A")}
                                alt={r.assignedAdminName ?? "Admin"}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={e => {
                                  const t = e.currentTarget;
                                  t.src = imageFallbackSvgDataUri(r.assignedAdminName ?? "A");
                                }}
                              />
                              {/* 'Me' badge */}
                              {r.isAssignedToMe && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" />
                              )}
                            </div>
                            {/* Info */}
                            <div className="min-w-0">
                              <p className={cn(
                                "max-w-[120px] truncate text-xs font-semibold",
                                r.isAssignedToMe
                                  ? "text-brand-600 dark:text-brand-400"
                                  : "text-gray-800 dark:text-white",
                              )}>
                                {r.assignedAdminName ?? "—"}
                                {r.isAssignedToMe && (
                                  <span className="ml-1 inline-flex items-center rounded-sm bg-brand-100 px-1 py-px text-[9px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                    Me
                                  </span>
                                )}
                              </p>
                              {r.assignedAdminEmail && (
                                <p className="max-w-[120px] truncate text-[10px] text-gray-400 dark:text-gray-500">
                                  {r.assignedAdminEmail}
                                </p>
                              )}
                              {r.assignmentMethod && (
                                <span className={cn(
                                  "mt-0.5 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
                                  r.assignmentMethod === "auto"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                                    : r.assignmentMethod === "redistribute"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
                                )}>
                                  {r.assignmentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600">Unassigned</span>
                        )}
                      </TableCell>

                      {/* ── Status History ─────────────────────────── */}
                      <TableCell className="px-4 py-3.5">
                        <StatusHistoryPopover orderId={r.id} />
                      </TableCell>

                      {/* Sticky Action */}
                      <TableCell className={cn(stickyActionCellClass, "px-4 py-3.5")}>
                        <div className="inline-flex items-center justify-end">
                          <button
                            type="button"
                            aria-label="Print invoice"
                            onClick={() =>
                              window.open(
                                `/order-invoice/${encodeURIComponent(r.id)}?print=1`,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg",
                              "border border-gray-200 bg-gray-50 text-gray-600",
                              "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600",
                              "active:scale-95 transition-all duration-150",
                              "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
                              "dark:hover:border-brand-500/50 dark:hover:bg-brand-500/15 dark:hover:text-brand-300",
                            )}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <OrderInfoModal open={viewOpen} onClose={() => setViewOpen(false)} order={selectedOrder} />
      <FraudCheckModal open={fraudOpen} onClose={() => setFraudOpen(false)} order={fraudOrder} />
    </>
  );
}
