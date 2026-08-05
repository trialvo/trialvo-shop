// src/components/orders/order-editor/OrderRefundPanel.tsx
import type React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import {
  createRefund,
  getRefundsByOrder,
  updateRefundStatus,
  type OrderRefund,
  type RefundMethod,
  type RefundStatus,
  type CreateRefundPayload,
} from "@/api/orders.api";

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatBDT = (v: number) =>
  v.toLocaleString(undefined, { maximumFractionDigits: 0 });

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  original_method: "Original Payment Method",
  bank_transfer: "Bank Transfer",
  mobile_banking: "Mobile Banking",
  cash: "Cash",
  other: "Other",
};

const StatusBadge: React.FC<{ status: RefundStatus }> = ({ status }) => {
  const configs: Record<RefundStatus, { label: string; classes: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      classes: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      icon: <Clock size={11} />,
    },
    processed: {
      label: "Processed",
      classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      icon: <CheckCircle size={11} />,
    },
    failed: {
      label: "Failed",
      classes: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
      icon: <XCircle size={11} />,
    },
  };
  const c = configs[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.classes}`}>
      {c.icon} {c.label}
    </span>
  );
};

// ── Issue Refund Modal ───────────────────────────────────────────────────────

interface IssueRefundModalProps {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const IssueRefundModal: React.FC<IssueRefundModalProps> = ({ orderId, onClose, onSuccess }) => {
  const [method, setMethod] = useState<RefundMethod>("cash");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote]  = useState("");

  const mutation = useMutation({
    mutationFn: (payload: CreateRefundPayload) => createRefund(payload),
    onSuccess: () => {
      toast.success("Refund entry created successfully");
      onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to create refund"),
  });

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    mutation.mutate({
      order_id: orderId,
      refund_method: method,
      refund_amount: amt,
      refund_reference: reference || undefined,
      note: note || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            {/* RefundIcon fallback */}
            <span className="text-sm font-bold">↩</span>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Refunds</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Issue Refund</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              Refund Method
            </div>
            <Select
              options={Object.entries(REFUND_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              defaultValue={method}
              onChange={(v) => setMethod(v as RefundMethod)}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              Amount (BDT)
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              Reference (optional)
            </div>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank ref / transaction ID"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
              Note (optional)
            </div>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for refund"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button onClick={onClose} size="sm" variant="outline">Cancel</Button>
          <Button
            onClick={handleSubmit}
            size="sm"
            variant="danger"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Issue Refund"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Card ────────────────────────────────────────────────────────────────

interface OrderRefundPanelProps {
  orderId: number;
  isLocked?: boolean;
}

const OrderRefundPanel: React.FC<OrderRefundPanelProps> = ({ orderId, isLocked = false }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const refundKey = ["order-refunds", orderId];
  const query = useQuery({
    queryKey: refundKey,
    queryFn: () => getRefundsByOrder(orderId),
    staleTime: 60_000,
  });

  const refunds: OrderRefund[] = query.data?.data ?? [];
  const summary = query.data?.summary;

  const markProcessed  = useMutation({
    mutationFn: (id: number) => updateRefundStatus(id, { status: "processed" }),
    onSuccess: () => {
      toast.success("Refund marked as processed");
      queryClient.invalidateQueries({ queryKey: refundKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <span className="text-sm font-bold">↩</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                V2-019
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Refund Ledger
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: refundKey })}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <RefreshCw size={14} />
            </button>
            {!isLocked && (
              <Button
                onClick={() => setShowModal(true)}
                size="sm"
                variant="outline"
                startIcon={<Plus size={13} />}
              >
                Issue Refund
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-center dark:bg-emerald-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Refunded
              </div>
              <div className="mt-0.5 text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                ৳{formatBDT(summary.total_refunded)}
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 p-2.5 text-center dark:bg-amber-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending
              </div>
              <div className="mt-0.5 text-base font-extrabold text-amber-700 dark:text-amber-300">
                ৳{formatBDT(summary.total_pending)}
              </div>
            </div>
          </div>
        )}

        {/* Refund List */}
        <div className="mt-3.5 space-y-2">
          {query.isLoading ? (
            <div className="py-4 text-center text-xs text-gray-400">Loading…</div>
          ) : refunds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-5 text-center text-xs text-gray-400 dark:border-gray-700">
              No refunds yet
            </div>
          ) : (
            refunds.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ৳{formatBDT(Number(r.refund_amount))}
                    </span>
                    <StatusBadge status={r.status} />
                    <span className="text-[10px] text-gray-400">{REFUND_METHOD_LABELS[r.refund_method]}</span>
                  </div>
                  {r.note && (
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{r.note}</div>
                  )}
                  {r.refund_reference && (
                    <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      Ref: {r.refund_reference}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400">
                    By {r.refunded_by_name?.trim() || "Admin"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>

                {r.status === "pending" && !isLocked && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => markProcessed.mutate(r.id)}
                    disabled={markProcessed.isPending}
                    startIcon={<CheckCircle size={12} />}
                  >
                    Mark Done
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <IssueRefundModal
          orderId={orderId}
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: refundKey })}
        />
      )}
    </>
  );
};

export default OrderRefundPanel;
