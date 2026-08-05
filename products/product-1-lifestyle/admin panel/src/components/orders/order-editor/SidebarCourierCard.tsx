import type React from "react";
import { useMemo, useState } from "react";
import {
  Truck,
  CheckCircle,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Wallet,
  Copy,
  Loader2,
  Send,
  Package,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type ProviderItem = { provider: string; is_auto_available: number; image?: string | null };

type Tab = "auto" | "manual";

interface SidebarCourierCardProps {
  method: string;
  consignmentId: string;
  trackingUrl?: string;
  lastUpdatedAtLabel?: string;

  // Provider info
  anyAutoAvailable?: boolean;
  providers?: ProviderItem[];

  // Balance data
  balanceByProvider?: Record<string, { balance: number | null; loading: boolean }>;

  // Weight
  weightKg?: number;

  onChange: (patch: { method?: string; consignmentId?: string }) => void;
  onSendAuto: (provider: string, weight: number) => void;
  onSendManual: (payload: {
    courier_provider: string;
    tracking_number?: string;
    reference_id?: string;
    memo?: string;
    weight?: number;
  }) => void;
  onComplete: () => void;
  onDownloadInvoice: () => void;
  onSyncStatus?: () => void;
  syncingStatus?: boolean;

  // Dispatch result
  dispatchResult?: {
    success: boolean;
    message: string;
    detail?: string;
    tracking?: string;
  } | null;
  onClearResult?: () => void;
}

function toLabel(p: string) {
  return p
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied!");
}

const SidebarCourierCard: React.FC<SidebarCourierCardProps> = ({
  method,
  consignmentId,
  trackingUrl,
  lastUpdatedAtLabel,
  anyAutoAvailable,
  providers,
  balanceByProvider,
  weightKg = 1,
  onChange,
  onSendAuto,
  onSendManual,
  onComplete,
  onDownloadInvoice,
  onSyncStatus,
  syncingStatus = false,
  dispatchResult,
  onClearResult,
}) => {
  const { t } = useTranslation();

  const hasAutoProviders = anyAutoAvailable && providers?.some((p) => p.is_auto_available);
  const [tab, setTab] = useState<Tab>(hasAutoProviders ? "auto" : "manual");

  // Auto dispatch state
  const [autoWeight, setAutoWeight] = useState(String(weightKg));

  // Manual dispatch state
  const [manualProvider, setManualProvider] = useState(method || "manual");
  const [manualTracking, setManualTracking] = useState("");
  const [manualReferenceId, setManualReferenceId] = useState("");
  const [manualMemo, setManualMemo] = useState("");
  const [manualWeight, setManualWeight] = useState(String(weightKg));

  const autoOptions = useMemo(
    () =>
      providers
        ?.filter((p) => p.is_auto_available)
        .map((p) => ({
          value: p.provider,
          label: toLabel(p.provider),
        })) ?? [],
    [providers]
  );

  const allOptions = useMemo(
    () =>
      providers?.map((p) => ({
        value: p.provider,
        label: `${toLabel(p.provider)}${p.is_auto_available ? " (Auto)" : ""}`,
      })) ?? [
        { value: "steadfast", label: "Steadfast" },
        { value: "pathao", label: "Pathao" },
        { value: "redx", label: "RedX" },
        { value: "paperfly", label: "Paperfly" },
      ],
    [providers]
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-5 sm:pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Truck size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              {t("orders.orderEditor.courier")}
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("orders.orderEditor.shipmentHandling")}
            </div>
          </div>
        </div>

        {providers?.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {t("orders.orderEditor.providers")}: {providers.length}
            </span>
            {anyAutoAvailable ? (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {t("orders.orderEditor.autoAvailable")}
              </span>
            ) : (
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {t("orders.orderEditor.manualOnly")}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 sm:px-5">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setTab("auto")}
            disabled={!hasAutoProviders}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all",
              tab === "auto"
                ? "bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400"
                : !hasAutoProviders
                  ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <Truck size={11} /> Auto
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all",
              tab === "manual"
                ? "bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            <Send size={11} /> Manual
          </button>
        </div>
      </div>

      {/* Dispatch result banner */}
      {dispatchResult && (
        <div className="px-4 pt-3 sm:px-5">
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border p-3",
              dispatchResult.success
                ? "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10"
                : "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10"
            )}
          >
            {dispatchResult.success ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success-600 dark:text-success-400" />
            ) : (
              <XCircle size={14} className="mt-0.5 shrink-0 text-error-600 dark:text-error-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("text-xs font-semibold", dispatchResult.success ? "text-success-800 dark:text-success-200" : "text-error-800 dark:text-error-200")}>
                {dispatchResult.message}
              </p>
              {dispatchResult.detail && (
                <p className="mt-0.5 text-[11px] text-error-700 dark:text-error-300 opacity-80">{dispatchResult.detail}</p>
              )}
              {dispatchResult.tracking && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-600 dark:text-gray-300">Tracking:</span>
                  <code className="rounded bg-white px-1 py-0.5 text-[11px] font-bold text-gray-900 dark:bg-gray-900 dark:text-white">
                    {dispatchResult.tracking}
                  </code>
                  <button type="button" onClick={() => copyToClipboard(dispatchResult.tracking ?? "")} className="text-gray-400 hover:text-gray-600">
                    <Copy size={10} />
                  </button>
                </div>
              )}
            </div>
            {onClearResult && (
              <button type="button" onClick={onClearResult} className="shrink-0 text-gray-400 hover:text-gray-600">
                <XCircle size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="p-4 pt-3 sm:p-5 sm:pt-3 space-y-3">
        {tab === "auto" && (
          <>
            {/* Provider list with balance */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.selectMethod")}
              </div>
              {autoOptions.map((opt) => {
                const bal = balanceByProvider?.[opt.value];
                const isSelected = method === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ method: opt.value })}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-left transition-all",
                      isSelected
                        ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {opt.label.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{opt.label}</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-success-50 px-1.5 py-0.5 text-[9px] font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
                          <CheckCircle2 size={8} /> Active
                        </span>
                      </div>
                      {bal && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <Wallet size={10} />
                          {bal.loading ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : bal.balance != null ? (
                            <span className="font-semibold text-gray-700 dark:text-gray-200">৳{bal.balance.toLocaleString()}</span>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="shrink-0 text-brand-500" />}
                  </button>
                );
              })}
            </div>

            {/* Weight */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                Parcel Weight (kg)
              </div>
              <Input
                type="number"
                value={autoWeight}
                onChange={(e) => setAutoWeight(e.target.value)}
                className="bg-white dark:bg-gray-800/50"
                placeholder="1"
                min={0.1}
                step={0.1}
              />
            </div>

            {/* Send button */}
            <Button
              onClick={() => onSendAuto(method, Math.max(0, Number(autoWeight) || 0))}
              size="sm"
              variant="primary"
              className="w-full"
              startIcon={<Truck size={13} />}
            >
              Request Courier
            </Button>
          </>
        )}

        {tab === "manual" && (
          <>
            {/* Provider select */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                Courier Provider
              </div>
              <Select
                options={allOptions}
                defaultValue={manualProvider}
                onChange={(v) => setManualProvider(v)}
                className="bg-white dark:bg-gray-800/50"
              />
            </div>

            {/* Tracking Number */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                Tracking Number
              </div>
              <Input
                value={manualTracking}
                onChange={(e) => setManualTracking(e.target.value)}
                className="bg-white dark:bg-gray-800/50"
                placeholder="Enter tracking number"
              />
            </div>

            {/* Reference ID */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                Reference / Consignment ID
              </div>
              <Input
                value={manualReferenceId}
                onChange={(e) => setManualReferenceId(e.target.value)}
                className="bg-white dark:bg-gray-800/50"
                placeholder="Optional"
              />
            </div>

            {/* Memo */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                Memo
              </div>
              <Input
                value={manualMemo}
                onChange={(e) => setManualMemo(e.target.value)}
                className="bg-white dark:bg-gray-800/50"
                placeholder="Optional"
              />
            </div>

            {/* Weight */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                Parcel Weight (kg)
              </div>
              <Input
                type="number"
                value={manualWeight}
                onChange={(e) => setManualWeight(e.target.value)}
                className="bg-white dark:bg-gray-800/50"
                placeholder="1"
                min={0.1}
                step={0.1}
              />
            </div>

            {/* Send button */}
            <Button
              onClick={() =>
                onSendManual({
                  courier_provider: manualProvider,
                  tracking_number: manualTracking || undefined,
                  reference_id: manualReferenceId || undefined,
                  memo: manualMemo || undefined,
                  weight: Math.max(0, Number(manualWeight) || 0) || undefined,
                })
              }
              size="sm"
              variant="primary"
              className="w-full"
              startIcon={<Send size={13} />}
            >
              Dispatch Manually
            </Button>
          </>
        )}
      </div>

      {/* Consignment + Tracking — always visible when dispatched */}
      {(consignmentId || trackingUrl) && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 dark:border-gray-800 sm:px-5">
          {consignmentId && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.consignmentId")}
              </div>
              <div className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs dark:border-gray-700 dark:bg-gray-800/50">
                <span className="font-mono font-semibold text-gray-900 dark:text-white truncate">{consignmentId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(consignmentId)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          )}

          {trackingUrl && (
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
                {t("orders.orderEditor.trackingLink")}
              </div>
              <div className="flex h-9 w-full items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs dark:border-gray-700 dark:bg-gray-800/50">
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  {trackingUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
        <Button
          onClick={onComplete}
          size="sm"
          variant="success"
          startIcon={<CheckCircle size={13} />}
        >
          {t("orders.orderEditor.complete")}
        </Button>
        <Button
          onClick={onDownloadInvoice}
          size="sm"
          variant="primary"
          startIcon={<FileText size={13} />}
        >
          {t("orders.orderEditor.courierInvoice")}
        </Button>
        {onSyncStatus && trackingUrl && (
          <Button
            onClick={onSyncStatus}
            size="sm"
            variant="outline"
            disabled={syncingStatus}
            startIcon={
              <RefreshCw size={13} className={syncingStatus ? "animate-spin" : undefined} />
            }
          >
            {syncingStatus ? "Syncing…" : "Sync Status"}
          </Button>
        )}
      </div>

      {lastUpdatedAtLabel ? (
        <div className="px-4 pb-3 text-[10px] text-gray-400 dark:text-gray-500 sm:px-5">
          {t("orders.orderEditor.updated")} {lastUpdatedAtLabel}
        </div>
      ) : null}
    </div>
  );
};

export default SidebarCourierCard;
