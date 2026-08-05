"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

export type StockActionType = "increase" | "decrease" | "set";

export type StockUpdatePayload = {
  productId: string;

  /** stock operation */
  type: StockActionType;

  /** qty used for increase/decrease, or new qty for set */
  qty: number;

  /** business reason: e.g. "purchase", "damage", "return", "adjustment" */
  reason: string;

  /** optional note for audit/history */
  note?: string;

  /** for server-side idempotency / tracing */
  clientRequestId?: string;

  /** ISO timestamp (client side); server can override */
  occurredAt?: string;
};

export type StockUpdateModalProduct = {
  id: string;
  name: string;
  currentStock: number;
};

type Props = {
  open: boolean;
  product: StockUpdateModalProduct | null;
  onClose: () => void;

  /** ✅ professional payload */
  onApply: (payload: StockUpdatePayload) => void;

  /** optional validation guard */
  minStockAfterUpdate?: number;
};

const REASON_KEYS = [
  { labelKey: "dashboard.stockUpdateModal.reasonPurchase", value: "purchase" },
  { labelKey: "dashboard.stockUpdateModal.reasonSale", value: "sale" },
  { labelKey: "dashboard.stockUpdateModal.reasonReturn", value: "return" },
  { labelKey: "dashboard.stockUpdateModal.reasonDamage", value: "damage" },
  { labelKey: "dashboard.stockUpdateModal.reasonAdjustment", value: "adjustment" },
];

const StockUpdateModal: React.FC<Props> = ({
  open,
  product,
  onClose,
  onApply,
  minStockAfterUpdate = 0,
}) => {
  const { t } = useTranslation();
  const modalOpen = open && !!product;
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(modalOpen);
  const [activeProduct, setActiveProduct] =
    React.useState<StockUpdateModalProduct | null>(null);

  React.useEffect(() => {
    if (open && product) setActiveProduct(product);
  }, [open, product]);

  React.useEffect(() => {
    if (!isMounted) setActiveProduct(null);
  }, [isMounted]);

  const [type, setType] = React.useState<StockActionType>("increase");
  const [qty, setQty] = React.useState<number>(1);
  const [reason, setReason] = React.useState<string>(REASON_KEYS[0].value);
  const [note, setNote] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    // reset per open to avoid stale values
    setType("increase");
    setQty(1);
    setReason(REASON_KEYS[0].value);
    setNote("");
  }, [open]);

  if (!isMounted || !activeProduct) return null;

  const current = activeProduct.currentStock;

  const nextStockPreview = (() => {
    if (type === "increase") return current + Math.max(0, qty);
    if (type === "decrease") return current - Math.max(0, qty);
    return Math.max(0, qty); // set
  })();

  const stockAfter = Math.max(0, nextStockPreview);
  const violatesMin = stockAfter < minStockAfterUpdate;

  const canApply =
    Number.isFinite(qty) &&
    qty >= 0 &&
    reason.trim().length > 0 &&
    !violatesMin;

  const handleApply = () => {
    if (!canApply) return;

    onApply({
      productId: activeProduct.id,
      type,
      qty: Math.floor(qty),
      reason: reason.trim(),
      note: note.trim() ? note.trim() : undefined,
      clientRequestId:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      occurredAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-[94%] max-w-xl rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {t("dashboard.stockUpdateModal.title")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activeProduct.name} • {t("dashboard.stockUpdateModal.current")}:{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {current}
                </span>
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
              className="rounded-xl"
            >
              {t("dashboard.stockUpdateModal.close")}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("dashboard.stockUpdateModal.action")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("increase")}
                className={[
                  "h-11 rounded-xl border text-sm font-semibold",
                  type === "increase"
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200",
                ].join(" ")}
              >
                {t("dashboard.stockUpdateModal.increase")}
              </button>
              <button
                type="button"
                onClick={() => setType("decrease")}
                className={[
                  "h-11 rounded-xl border text-sm font-semibold",
                  type === "decrease"
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200",
                ].join(" ")}
              >
                {t("dashboard.stockUpdateModal.decrease")}
              </button>
              <button
                type="button"
                onClick={() => setType("set")}
                className={[
                  "h-11 rounded-xl border text-sm font-semibold",
                  type === "set"
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200",
                ].join(" ")}
              >
                {t("dashboard.stockUpdateModal.set")}
              </button>
            </div>
          </div>

          {/* qty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {type === "set" ? t("dashboard.stockUpdateModal.newStockQty") : t("dashboard.stockUpdateModal.qty")}
            </label>
            <Input
              value={String(qty)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setQty(Number(e.target.value))
              }
              className="h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
              placeholder={type === "set" ? "e.g. 120" : "e.g. 10"}
              type="number"
              min={0}
            />

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.stockUpdateModal.preview")}:{" "}
              <span
                className={[
                  "font-semibold",
                  violatesMin ? "text-red-600 dark:text-red-300" : "text-gray-900 dark:text-gray-100",
                ].join(" ")}
              >
                {stockAfter}
              </span>
              {violatesMin && (
                <span className="ml-2 text-xs text-red-600 dark:text-red-300">
                  ({t("dashboard.stockUpdateModal.mustBeMin", { min: minStockAfterUpdate })})
                </span>
              )}
            </div>
          </div>

          {/* reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("dashboard.stockUpdateModal.reason")}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              {REASON_KEYS.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(r.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("dashboard.stockUpdateModal.noteOptional")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder={t("dashboard.stockUpdateModal.notePlaceholder")}
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} className="rounded-xl">
            {t("dashboard.stockUpdateModal.cancel")}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="rounded-xl bg-brand-500 hover:bg-brand-600"
          >
            {t("dashboard.stockUpdateModal.applyUpdate")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockUpdateModal;
