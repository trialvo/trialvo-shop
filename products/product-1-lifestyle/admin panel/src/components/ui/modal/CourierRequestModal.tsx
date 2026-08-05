import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Send,
  Package,
  Wallet,
  MapPin,
  Phone,
  User,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Info,
} from "lucide-react";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/config/env";

import type { OrderRow } from "@/components/orders/all-orders/types";
import {
  dispatchOrderCourier,
  manualDispatchOrder,
  getCourierBalance,
  trackOrderCourier,
  ordersKeys,
  type DispatchCourierProvider,
} from "@/api/orders.api";

/* ──────────────────────────────────────────────────────────────────────
   Types & Helpers
   ────────────────────────────────────────────────────────────────────── */

type Props = {
  open: boolean;
  onClose: () => void;
  order: OrderRow;
};

type Tab = "auto" | "manual" | "tracking";

function toDispatchProviderId(v: string): DispatchCourierProvider | null {
  const id = String(v || "").toLowerCase().trim();
  if (id === "paperfly") return "paperfly";
  if (id === "redx") return "redx";
  if (id === "pathao") return "pathao";
  if (id === "steadfast") return "steadfast";
  return null;
}

function readApiError(err: any, fallback: string) {
  return (
    err?.response?.data?.error ??
    err?.response?.data?.message ??
    err?.message ??
    fallback
  );
}

function formatMoney(symbol: string | undefined, n: unknown) {
  const v =
    typeof n === "number" && Number.isFinite(n) ? n : Number(n ?? 0) || 0;
  return `${symbol ?? ""}${v.toLocaleString()}`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied!");
}

const PROVIDER_META: Record<
  string,
  { label: string; color: string; darkColor: string }
> = {
  steadfast: {
    label: "Steadfast",
    color: "bg-emerald-500",
    darkColor: "dark:bg-emerald-600",
  },
  pathao: {
    label: "Pathao",
    color: "bg-red-500",
    darkColor: "dark:bg-red-600",
  },
  redx: {
    label: "RedX",
    color: "bg-rose-600",
    darkColor: "dark:bg-rose-700",
  },
  paperfly: {
    label: "Paperfly",
    color: "bg-blue-500",
    darkColor: "dark:bg-blue-600",
  },
};

function getProviderMeta(id: string) {
  return (
    PROVIDER_META[id?.toLowerCase()] ?? {
      label: id || "Unknown",
      color: "bg-gray-500",
      darkColor: "dark:bg-gray-600",
    }
  );
}

const MANUAL_PROVIDERS: DispatchCourierProvider[] = [
  "steadfast",
  "redx",
  "pathao",
  "paperfly",
];

/* ──────────────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────────────── */

function InfoRow({
  icon: Icon,
  label,
  value,
  copyable,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
        <Icon size={14} className="shrink-0" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-sm font-semibold text-gray-900 dark:text-white",
            mono && "font-mono text-xs"
          )}
        >
          {value || "—"}
        </span>
        {copyable && value && value !== "—" && (
          <button
            type="button"
            onClick={() => copyToClipboard(value)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

function ProviderCard({
  providerId,
  providerName,
  connected,
  selected,
  onClick,
  balance,
  balanceLoading,
  image,
}: {
  providerId: string;
  providerName: string;
  connected: boolean;
  selected: boolean;
  onClick: () => void;
  balance?: number | null;
  balanceLoading?: boolean;
  image?: string | null;
}) {
  const meta = getProviderMeta(providerId);
  const imgSrc = image ? toPublicUrl(image) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!connected}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
        selected
          ? "border-brand-500 bg-brand-500/5 shadow-sm dark:bg-brand-500/10"
          : connected
            ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
            : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50 dark:border-gray-900 dark:bg-gray-950/50"
      )}
    >
      {/* Provider avatar */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={meta.label}
          className="h-9 w-9 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
            meta.color,
            meta.darkColor
          )}
        >
          {meta.label.slice(0, 2).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {providerName || meta.label}
          </p>
          {connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
              <CheckCircle2 size={10} /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <XCircle size={10} /> Unavailable
            </span>
          )}
        </div>

        {/* Balance */}
        {connected && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Wallet size={11} />
            {balanceLoading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : balance != null ? (
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                ৳{balance.toLocaleString()}
              </span>
            ) : (
              <span>Balance not loaded</span>
            )}
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 size={18} className="text-brand-500" />
        </div>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  let cls =
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  if (s.includes("deliver"))
    cls =
      "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
  else if (s.includes("cancel") || s.includes("return"))
    cls =
      "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
  else if (s.includes("process") || s.includes("ship") || s.includes("transit"))
    cls =
      "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300";
  else if (s.includes("pick"))
    cls =
      "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        cls
      )}
    >
      {status || "Unknown"}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────────────── */

export default function CourierRequestModal({ open, onClose, order }: Props) {
  const titleId = "courier-request-modal-title";
  const queryClient = useQueryClient();

  /* ── derived courier data ── */
  const autoConnectedList = useMemo(() => {
    const list = order.courier?.availableAutoCouriers ?? [];
    return list.filter((x) => x.connected);
  }, [order.courier?.availableAutoCouriers]);

  const allProvidersList = useMemo(() => {
    return order.courier?.availableAutoCouriers ?? [];
  }, [order.courier?.availableAutoCouriers]);

  const hasAnyAuto =
    Boolean(order.courier?.apiConfigured) && autoConnectedList.length > 0;

  const existingTracking = order.courier?.trackingNo ?? "";
  const existingProvider = order.courier?.providerName ?? "";
  const existingMemo = order.courier?.memoNo ?? "";
  const hasExistingCourier = Boolean(existingTracking || existingProvider);

  /* ── tab state ── */
  const defaultTab: Tab = existingTracking
    ? "tracking"
    : hasAnyAuto
      ? "auto"
      : "manual";

  const [tab, setTab] = useState<Tab>(defaultTab);

  /* ── Auto state ── */
  const defaultAuto = useMemo(() => {
    const first =
      autoConnectedList.find((x) => x.isDefault)?.providerId ??
      autoConnectedList[0]?.providerId;
    return first ? String(first) : "";
  }, [autoConnectedList]);

  const [autoProvider, setAutoProvider] = useState<string>(defaultAuto);
  const [autoWeightKg, setAutoWeightKg] = useState<string>("1");

  /* ── Manual state ── */
  const [manualProvider, setManualProvider] = useState<string>(
    defaultAuto || "steadfast"
  );
  const [manualTracking, setManualTracking] = useState<string>("");
  const [manualReferenceId, setManualReferenceId] = useState<string>("");
  const [manualMemo, setManualMemo] = useState<string>("");
  const [manualWeightKg, setManualWeightKg] = useState<string>("1");

  /* ── dispatch success state ── */
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message: string;
    detail?: string;
    tracking?: string;
    provider?: string;
  } | null>(null);

  /* ── Reset on open ── */
  useEffect(() => {
    if (!open) return;
    const nextTab: Tab = existingTracking
      ? "tracking"
      : hasAnyAuto
        ? "auto"
        : "manual";
    setTab(nextTab);
    setAutoProvider(defaultAuto);
    const wkg = String(Number(preview.weightKg ?? 0));
    setAutoWeightKg(wkg);
    setManualProvider(defaultAuto || "steadfast");
    setManualTracking("");
    setManualReferenceId("");
    setManualMemo("");
    setManualWeightKg(wkg);
    setDispatchResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.id]);

  /* ── Balance queries for ALL connected providers (parallel) ── */
  const balanceQueries = useQueries({
    queries: autoConnectedList.map((c) => ({
      queryKey: ["courier-balance", c.providerId],
      queryFn: () => getCourierBalance(String(c.providerId)),
      enabled: open && tab === "auto" && hasAnyAuto,
      staleTime: 60_000,
      retry: 1,
    })),
  });

  // Build a map: providerId -> { balance, isLoading }
  const balanceByProvider = useMemo(() => {
    const map: Record<string, { balance: number | null; loading: boolean }> = {};
    autoConnectedList.forEach((c, i) => {
      const q = balanceQueries[i];
      map[String(c.providerId)] = {
        balance: (q?.data as any)?.balance ?? null,
        loading: q?.isFetching ?? false,
      };
    });
    return map;
  }, [balanceQueries, autoConnectedList]);

  /* ── Tracking query ── */
  const trackingQuery = useQuery({
    queryKey: ["courier-track", order.id],
    queryFn: () => trackOrderCourier(Number(order.id)),
    enabled: open && tab === "tracking" && !!existingTracking,
    staleTime: 30_000,
    retry: 1,
  });

  /* ── Preview data ── */
  const preview = useMemo(
    () =>
      order.courier?.preview ?? {
        receiverName: order.customerName,
        receiverPhone: order.customerPhone,
        address: order.shippingAddress ?? "—",
        area: order.shippingArea ?? order.shippingLocation,
        codAmount: order.paymentMethod === "COD" ? order.total : 0,
        weightKg: 1,
      },
    [order]
  );

  const deliveryInfo = useMemo(() => {
    const shippingCost = Number(order.shippingCost ?? 0) || 0;
    const discount = Number(order.discount ?? 0) || 0;
    const paidAmount = Number(order.paidAmount ?? 0) || 0;
    return {
      shippingCost,
      discount,
      paidAmount,
      dueAmount: Math.max(0, Number(order.total ?? 0) - paidAmount),
    };
  }, [order]);

  /* ── Helpers ── */
  /**
   * Immediately patch the dispatched order in every cached list query so the
   * new courier weight / status is visible the instant the user switches tabs
   * — without needing a page refresh.
   */
  const patchOrderInCache = (provider: string, newWeight: number | undefined) => {
    queryClient.setQueriesData<any>(
      { queryKey: ordersKeys.lists() },
      (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((o: any) => {
            if (String(o.id) !== String(order.id)) return o;
            const prevCourier = o.couriers?.[0] ?? {};
            return {
              ...o,
              order_status: 'processing',
              couriers: [{
                ...prevCourier,
                courier_provider: provider,
                weight: newWeight != null ? newWeight : prevCourier.weight,
              }],
            };
          }),
        };
      }
    );
  };

  /* ── Mutations ── */
  const dispatchMutation = useMutation({
    mutationFn: async (payload: {
      provider: DispatchCourierProvider;
      weight?: number;
    }) =>
      dispatchOrderCourier(Number(order.id), {
        courier_provider: payload.provider,
        weight: payload.weight,
      }),
    onSuccess: async (res, payload) => {
      // Immediately patch all cached list queries so switching tabs shows new weight
      patchOrderInCache(payload.provider, payload.weight);
      setDispatchResult({
        success: true,
        message: res?.message || "Order dispatched successfully!",
        tracking: res?.tracking_number,
        provider: res?.courier,
      });
      toast.success(res?.message || "Order dispatched successfully!");
      // Background refresh to get authoritative server data
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
    },
    onError: (err: any) => {
      const detail = readApiError(err, "Failed to dispatch order");
      setDispatchResult({ success: false, message: "Dispatch Failed", detail });
      toast.error("Order could not be dispatched. Check the error message for details.");
    },
  });

  const manualDispatchMutation = useMutation({
    mutationFn: async (payload: {
      provider: DispatchCourierProvider;
      tracking_number?: string;
      reference_id?: string;
      memo?: string;
      weight?: number;
    }) =>
      manualDispatchOrder(Number(order.id), {
        courier_provider: payload.provider,
        tracking_number: payload.tracking_number || undefined,
        reference_id: payload.reference_id || undefined,
        memo: payload.memo || undefined,
        weight: payload.weight,
      }),
    onSuccess: async (res, payload) => {
      // Immediately patch all cached list queries so switching tabs shows new weight
      patchOrderInCache(payload.provider, payload.weight);
      setDispatchResult({
        success: true,
        message: res?.message || "Order manually dispatched!",
        tracking: res?.tracking_number ?? undefined,
        provider: res?.courier,
      });
      toast.success(res?.message || "Order manually dispatched!");
      // Background refresh to get authoritative server data
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
    },
    onError: (err: any) => {
      const detail = readApiError(err, "Failed to manual dispatch");
      setDispatchResult({ success: false, message: "Dispatch Failed", detail });
      toast.error("Order could not be dispatched. Check the error message for details.");
    },
  });

  const autoProviderId = toDispatchProviderId(autoProvider);
  const manualProviderId = toDispatchProviderId(manualProvider);
  const autoWeight =
    Math.max(0, Number(autoWeightKg || "0") || 0) || undefined;
  const manualWeight =
    Math.max(0, Number(manualWeightKg || "0") || 0) || undefined;

  /** Max weight allowed per courier (mirrors backend COURIER_MAX_WEIGHT) */
  const COURIER_MAX_WEIGHT: Record<string, number> = {
    pathao:    200,
    steadfast: 99999, // no documented hard cap
    redx:      200,
    paperfly:  200,
  };
  const autoMaxWeight   = COURIER_MAX_WEIGHT[autoProvider]   ?? 200;
  const manualMaxWeight = COURIER_MAX_WEIGHT[manualProvider] ?? 200;

  const isPending =
    dispatchMutation.isPending || manualDispatchMutation.isPending;
  const canAutoRequest =
    hasAnyAuto && !!autoProviderId && !isPending;
  const canManualSend = !!manualProviderId && !isPending;

  /* ── TAB BUTTONS ── */
  const tabs: { id: Tab; label: string; icon: typeof Truck; disabled?: boolean }[] =
    [
      {
        id: "auto",
        label: "Auto (API)",
        icon: Truck,
        disabled: !hasAnyAuto,
      },
      { id: "manual", label: "Manual", icon: Send },
      ...(hasExistingCourier
        ? [{ id: "tracking" as Tab, label: "Tracking", icon: Package }]
        : []),
    ];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      titleId={titleId}
      className="w-full max-w-[1060px] overflow-hidden"
    >
      <div className="bg-white dark:bg-gray-950">
        {/* ── HEADER ── */}
        <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3
                id={titleId}
                className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
              >
                <Truck size={20} className="text-brand-500" />
                Send Courier
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  #{order.id}
                </span>
              </h3>
            </div>

            {/* Tab buttons */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  disabled={t.disabled}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                    tab === t.id
                      ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                      : t.disabled
                        ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  )}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── DISPATCH RESULT BANNER ── */}
        {dispatchResult && (
          <div
            className={cn(
              "mx-6 mt-4 flex items-start gap-3 rounded-xl border p-4",
              dispatchResult.success
                ? "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
                : "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
            )}
          >
            {dispatchResult.success ? (
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-success-600 dark:text-success-400"
              />
            ) : (
              <XCircle
                size={20}
                className="mt-0.5 shrink-0 text-error-600 dark:text-error-400"
              />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  dispatchResult.success
                    ? "text-success-800 dark:text-success-200"
                    : "text-error-800 dark:text-error-200"
                )}
              >
                {dispatchResult.message}
              </p>
              {dispatchResult.detail && (
                <p className="mt-1 text-xs text-error-700 dark:text-error-300 opacity-80">
                  {dispatchResult.detail}
                </p>
              )}
              {dispatchResult.tracking && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Tracking:
                  </span>
                  <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-gray-900 dark:bg-gray-900 dark:text-white">
                    {dispatchResult.tracking}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(dispatchResult.tracking ?? "")
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setDispatchResult(null);
                if (dispatchResult.success) onClose();
              }}
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* ── BODY ── */}
        <div className="grid grid-cols-12 gap-5 px-6 py-5">
          {/* ── LEFT: Order Info ── */}
          <div className="col-span-12 space-y-4 md:col-span-5">
            {/* Receiver */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <User size={13} />
                Receiver Details
              </h4>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                <InfoRow
                  icon={User}
                  label="Name"
                  value={preview.receiverName ?? "—"}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={preview.receiverPhone ?? "—"}
                  copyable
                />
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={preview.address ?? "—"}
                />
                <InfoRow
                  icon={MapPin}
                  label="Area"
                  value={preview.area ?? "—"}
                />
              </div>
            </div>

            {/* Money breakdown */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Wallet size={13} />
                Financial Summary
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "COD Amount",
                    value: formatMoney(
                      order.currencySymbol,
                      preview.codAmount ?? 0
                    ),
                    highlight: true,
                  },
                  {
                    label: "Shipping",
                    value: formatMoney(
                      order.currencySymbol,
                      deliveryInfo.shippingCost
                    ),
                  },
                  {
                    label: "Paid",
                    value: formatMoney(
                      order.currencySymbol,
                      deliveryInfo.paidAmount
                    ),
                  },
                  {
                    label: "Due",
                    value: formatMoney(
                      order.currencySymbol,
                      deliveryInfo.dueAmount
                    ),
                    warn: deliveryInfo.dueAmount > 0,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-lg border p-2.5",
                      item.highlight
                        ? "border-brand-200 bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/5"
                        : item.warn
                          ? "border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5"
                          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm font-bold",
                        item.highlight
                          ? "text-brand-700 dark:text-brand-300"
                          : item.warn
                            ? "text-orange-700 dark:text-orange-300"
                            : "text-gray-900 dark:text-white"
                      )}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Weight + Note */}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Weight:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {(typeof preview.weightKg === "number"
                      ? preview.weightKg
                      : 1
                    ).toFixed(1)}{" "}
                    kg
                  </span>
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span>
                  Payment:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {order.paymentMethod}
                  </span>
                </span>
              </div>
            </div>

            {/* Existing courier info */}
            {hasExistingCourier && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Package size={13} />
                  Current Courier
                </h4>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  <InfoRow
                    icon={Truck}
                    label="Provider"
                    value={existingProvider}
                  />
                  <InfoRow
                    icon={Package}
                    label="Tracking"
                    value={existingTracking || "—"}
                    copyable
                    mono
                  />
                  <InfoRow
                    icon={Info}
                    label="Memo"
                    value={existingMemo || "—"}
                    copyable
                  />
                </div>
              </div>
            )}

            {/* Order note */}
            {order.orderNote?.trim() && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-500/20 dark:bg-orange-500/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                      Order Note
                    </p>
                    <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                      {order.orderNote}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Action Panel ── */}
          <div className="col-span-12 md:col-span-7">
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              {/* ═══ AUTO TAB ═══ */}
              {tab === "auto" && (
                <div className="p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Truck size={16} className="text-brand-500" />
                    Auto Dispatch via API
                  </h4>

                  {/* Provider cards */}
                  <div className="grid gap-2.5">
                    {allProvidersList.map((c) => (
                      <ProviderCard
                        key={c.providerId}
                        providerId={c.providerId}
                        providerName={c.providerName}
                        connected={c.connected}
                        selected={autoProvider === c.providerId}
                        onClick={() => setAutoProvider(c.providerId)}
                        image={c.image}
                        balance={
                          balanceByProvider[String(c.providerId)]?.balance ?? null
                        }
                        balanceLoading={
                          balanceByProvider[String(c.providerId)]?.loading ?? false
                        }
                      />
                    ))}

                    {!allProvidersList.length && (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900">
                        <XCircle
                          size={24}
                          className="mx-auto text-gray-400"
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          No courier providers configured
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Parcel Weight (kg)
                    </label>
                    <input
                      value={autoWeightKg}
                      onChange={(e) => setAutoWeightKg(e.target.value)}
                      type="number"
                      min={0.1}
                      max={autoMaxWeight}
                      step="0.1"
                      placeholder="e.g. 1.5"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-950"
                    />
                  </div>

                  {/* Info */}
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-500/20 dark:bg-brand-500/5">
                    <Info
                      size={14}
                      className="mt-0.5 shrink-0 text-brand-500"
                    />
                    <p className="text-xs text-brand-700 dark:text-brand-300">
                      Auto dispatch sends the order directly to the courier's
                      API. The order status will change to{" "}
                      <span className="font-semibold">Processing</span>{" "}
                      automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* ═══ MANUAL TAB ═══ */}
              {tab === "manual" && (
                <div className="p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Send size={16} className="text-brand-500" />
                    Manual Dispatch
                  </h4>

                  {/* Provider select */}
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Courier Provider
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MANUAL_PROVIDERS.map((id) => {
                        const meta = getProviderMeta(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setManualProvider(id)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border-2 p-2.5 text-left text-sm font-semibold transition-all",
                              manualProvider === id
                                ? "border-brand-500 bg-brand-500/5 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                                : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:text-gray-300 dark:hover:border-gray-700"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
                                meta.color
                              )}
                            >
                              {meta.label.slice(0, 2).toUpperCase()}
                            </div>
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Tracking Number{" "}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        value={manualTracking}
                        onChange={(e) => setManualTracking(e.target.value)}
                        placeholder="PF-2025-009812"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Reference ID{" "}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        value={manualReferenceId}
                        onChange={(e) => setManualReferenceId(e.target.value)}
                        placeholder="INV-77821"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-950"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Memo <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        value={manualMemo}
                        onChange={(e) => setManualMemo(e.target.value)}
                        placeholder="Manually booked via courier dashboard"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-950"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Weight (kg){" "}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        value={manualWeightKg}
                        onChange={(e) => setManualWeightKg(e.target.value)}
                        type="number"
                        min={0.1}
                        max={manualMaxWeight}
                        step="0.1"
                        placeholder="e.g. 1.5"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-950"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                    <Info
                      size={14}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Manual dispatch records courier info WITHOUT calling the
                      courier API. Use this when you've already booked via
                      the courier's own dashboard.
                    </p>
                  </div>
                </div>
              )}

              {/* ═══ TRACKING TAB ═══ */}
              {tab === "tracking" && (
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                      <Package size={16} className="text-brand-500" />
                      Live Tracking
                    </h4>
                    <button
                      type="button"
                      onClick={() => trackingQuery.refetch()}
                      disabled={trackingQuery.isFetching}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                    >
                      <RefreshCw
                        size={12}
                        className={cn(
                          trackingQuery.isFetching && "animate-spin"
                        )}
                      />
                      Refresh
                    </button>
                  </div>

                  {trackingQuery.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2
                        size={28}
                        className="animate-spin text-brand-500"
                      />
                      <p className="mt-3 text-sm text-gray-500">
                        Fetching tracking info...
                      </p>
                    </div>
                  ) : trackingQuery.isError ? (
                    <div className="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/5">
                      <div className="flex items-start gap-2">
                        <XCircle
                          size={16}
                          className="mt-0.5 text-error-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-error-800 dark:text-error-200">
                            Tracking unavailable
                          </p>
                          <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                            {trackingQuery.error?.message ||
                              "Could not fetch tracking status"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : trackingQuery.data ? (
                    <div className="space-y-4">
                      {/* Status card */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Courier Status
                            </p>
                            <div className="mt-1">
                              <StatusBadge
                                status={
                                  trackingQuery.data.courier_live_status
                                }
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Internal Status
                            </p>
                            <div className="mt-1">
                              <StatusBadge
                                status={
                                  trackingQuery.data.current_internal_status
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Provider
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {trackingQuery.data.provider}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Tracking Number
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-bold text-gray-900 dark:text-white">
                              {trackingQuery.data.tracking_number}
                            </code>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  trackingQuery.data!.tracking_number
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Last Updated
                          </span>
                          <span className="text-xs text-gray-700 dark:text-gray-200">
                            {trackingQuery.data.last_updated
                              ? new Date(
                                trackingQuery.data.last_updated
                              ).toLocaleString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-sm text-gray-500">
                      No tracking data available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {order.courier?.lastMessage ?? "Ready to dispatch"}
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10"
                disabled={isPending}
              >
                {dispatchResult?.success ? "Close" : "Cancel"}
              </Button>

              {tab === "auto" && !dispatchResult?.success && (
                <Button
                  className="h-10 gap-2"
                  disabled={!canAutoRequest}
                  onClick={() => {
                    if (!autoProviderId) return;
                    dispatchMutation.mutate({
                      provider: autoProviderId,
                      weight: autoWeight,
                    });
                  }}
                >
                  {dispatchMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Truck size={14} />
                      Request Courier
                    </>
                  )}
                </Button>
              )}

              {tab === "manual" && !dispatchResult?.success && (
                <Button
                  className="h-10 gap-2"
                  disabled={!canManualSend}
                  onClick={() => {
                    if (!manualProviderId) return;
                    manualDispatchMutation.mutate({
                      provider: manualProviderId,
                      tracking_number:
                        manualTracking.trim() || undefined,
                      reference_id:
                        manualReferenceId.trim() || undefined,
                      memo: manualMemo.trim() || undefined,
                      weight: manualWeight,
                    });
                  }}
                >
                  {manualDispatchMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Manual
                    </>
                  )}
                </Button>
              )}

              {tab === "tracking" && (
                <Button
                  variant="outline"
                  className="h-10 gap-2"
                  onClick={() => {
                    if (existingTracking) {
                      const provider = (
                        existingProvider || ""
                      ).toLowerCase();
                      const phone = order.customerPhone || "";
                      let url = "";
                      if (provider.includes("steadfast"))
                        url = `https://steadfast.com.bd/t/${existingTracking}`;
                      else if (provider.includes("pathao"))
                        url = `https://merchant.pathao.com/tracking?consignment_id=${existingTracking}${phone ? `&phone=${phone}` : ""}`;
                      else if (provider.includes("redx"))
                        url = `https://redx.com.bd/track-parcel/?trackingId=${existingTracking}`;

                      if (url)
                        window.open(url, "_blank", "noopener,noreferrer");
                      else
                        copyToClipboard(existingTracking);
                    }
                  }}
                >
                  <ExternalLink size={14} />
                  Open Courier Portal
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
