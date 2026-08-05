import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type {
  FraudLevel,
  OrderRow,
} from "@/components/orders/all-orders/types";

type Props = {
  open: boolean;
  onClose: () => void;
  order: OrderRow | null;
};

function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "0%";
  return `${(value * 100).toFixed(digits)}%`;
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function statusLabel(status: FraudLevel) {
  switch (status) {
    case "safe":
      return "Safe";
    case "medium":
      return "Medium";
    case "high":
      return "Fraud";
    case "not_found":
      return "Not Found";
    default:
      return "Unknown";
  }
}

function statusIcon(status: FraudLevel) {
  if (status === "safe") return <CheckCircle2 size={18} />;
  if (status === "medium") return <AlertTriangle size={18} />;
  if (status === "high") return <ShieldAlert size={18} />;
  return <HelpCircle size={18} />;
}

function statusColors(status: FraudLevel) {
  switch (status) {
    case "safe":
      return "text-success-600 bg-success-50 ring-success-200";
    case "medium":
      return "text-orange-600 bg-orange-50 ring-orange-200";
    case "high":
      return "text-error-600 bg-error-50 ring-error-200";
    case "not_found":
    default:
      return "text-gray-600 bg-gray-100 ring-gray-200";
  }
}

function ringColor(status: FraudLevel) {
  switch (status) {
    case "safe":
      return "text-success-500";
    case "medium":
      return "text-orange-500";
    case "high":
      return "text-error-500";
    default:
      return "text-gray-300";
  }
}

function RatioRing({
  value,
  status,
  label,
}: {
  value: number | null;
  status: FraudLevel;
  label: string;
}) {
  const size = 160;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp01(value ?? 0);
  const dash = `${progress * circumference} ${circumference}`;

  return (
    <div className="relative">
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dash}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={ringColor(status)}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-300">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function FraudCheckModal({ open, onClose, order }: Props) {
  const titleId = "fraud-check-modal-title";
  if (!order) return null;

  const fraud = order.fraudCheck;

  const deliveryRatio = fraud?.deliveryRatio ?? null;
  const deliveryRatioLabel = formatPercent(deliveryRatio, 1);

  const summary = useMemo(() => {
    if (!fraud) {
      return {
        total: 0,
        delivered: 0,
        cancelled: 0,
        ratioLabel: "0%",
      };
    }
    return {
      total: fraud.totalParcels,
      delivered: fraud.totalDelivered,
      cancelled: fraud.totalCancel,
      ratioLabel: formatPercent(fraud.deliveryRatio, 1),
    };
  }, [fraud]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      titleId={titleId}
      className="w-full max-w-[1100px] overflow-hidden"
      showCloseButton={false}
    >
      <div className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white flex flex-col">
        <div className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-r from-brand-50 via-white to-blue-50 px-6 py-5 dark:border-gray-800 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10" />
            <div className="absolute -left-20 -bottom-24 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
          </div>

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-gray-200 bg-white text-brand-500 shadow-theme-xs dark:border-gray-800 dark:bg-gray-950">
                {fraud ? statusIcon(fraud.status) : <ShieldAlert size={18} />}
              </div>
              <div className="min-w-0">
                <h3
                  id={titleId}
                  className="truncate text-xl sm:text-2xl font-extrabold tracking-wide"
                >
                  Fraud Checker
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Order #{order.id}
                </p>
              </div>

              {fraud ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                    statusColors(fraud.status),
                  )}
                >
                  {statusIcon(fraud.status)}
                  {statusLabel(fraud.status)}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-error-200 bg-white text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-900/40 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10"
            >
              <X size={16} />
            </button>
          </div>

          {fraud ? (
            <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                Mobile: {fraud.mobileNumber || "-"}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                Checked: {formatDateTime(fraud.checkedAt)}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                Total Parcels: {fraud.totalParcels}
              </span>
            </div>
          ) : null}
        </div>

        <div className="max-h-[620px] overflow-y-auto px-6 py-6 custom-scrollbar">
          {!fraud ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
              Fraud check data is not available for this order.
            </div>
          ) : (
            <div className="space-y-6">
              {!fraud.success ? (
                <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle size={16} />
                    Fraud check failed
                  </div>
                  <div className="mt-2 text-xs">
                    {fraud.systemNote ||
                      "Fraud check service was unavailable for this order."}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-12 gap-6 items-stretch">
                <div className="col-span-12 lg:col-span-4 h-full">
                  <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] flex flex-col">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-gray-200 bg-white text-brand-500 shadow-theme-xs dark:border-gray-800 dark:bg-gray-950">
                        {statusIcon(fraud.status)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Delivery Success Ratio
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Checked {formatDateTime(fraud.checkedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-1 flex-col items-center justify-center">
                      <RatioRing
                        value={deliveryRatio}
                        status={fraud.status}
                        label={deliveryRatioLabel}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-1 text-center font-semibold dark:border-gray-800 dark:bg-gray-900">
                        Delivered: {fraud.totalDelivered}
                      </span>
                      <span className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-1 text-center font-semibold dark:border-gray-800 dark:bg-gray-900">
                        Cancelled: {fraud.totalCancel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-8 space-y-5 h-full">
                  <div className="grid grid-cols-12 gap-3">
                    {[
                      {
                        label: "Total Order",
                        value: summary.total,
                      },
                      {
                        label: "Total Delivered",
                        value: summary.delivered,
                      },
                      {
                        label: "Total Cancelled",
                        value: summary.cancelled,
                      },
                      {
                        label: "Delivery Rate",
                        value: summary.ratioLabel,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className={cn(
                          "col-span-12 sm:col-span-6 lg:col-span-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]",
                        )}
                      >
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {card.label}
                        </div>
                        <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                          {card.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="overflow-x-auto">
                      <table className="min-w-[620px] w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                              Courier
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                              Orders
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                              Delivered
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                              Cancelled
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                              Delivery %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(fraud.providers ?? []).length ? (
                            fraud.providers.map((p) => {
                              const ratioLabel =
                                p.status === "notfound"
                                  ? "Not Found"
                                  : formatPercent(p.ratio, 0);
                              const barWidth =
                                p.status === "notfound"
                                  ? 0
                                  : Math.round((p.ratio ?? 0) * 100);

                              return (
                                <tr
                                  key={`${p.id}-${p.name}`}
                                  className={cn(
                                    "border-b border-gray-100 dark:border-gray-800",
                                    p.status === "notfound" && "opacity-70",
                                  )}
                                >
                                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-gray-200 bg-gray-50 text-xs font-bold text-brand-500 dark:border-gray-800 dark:bg-gray-900">
                                        {p.name?.[0] ?? "C"}
                                      </span>
                                      <span>{p.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                                    {p.total}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                                    {p.delivered}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                                    {p.cancelled}
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="flex items-center gap-3">
                                      <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-800">
                                        <div
                                          className="h-2 rounded-full bg-success-500"
                                          style={{ width: `${barWidth}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        {ratioLabel}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                              >
                                No courier data available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
