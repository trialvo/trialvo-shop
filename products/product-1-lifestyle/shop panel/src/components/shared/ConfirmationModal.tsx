"use client";

import { AlertTriangle } from "lucide-react";
import { ModalShell, type ModalLifecycleProps } from "@/components/shared/ModalShell";
import { CONFIRMATION_STYLES } from "@/lib/theme";
import type { ConfirmationVariant } from "@/types";

interface ConfirmationModalProps extends ModalLifecycleProps {
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  loading?: boolean;
}



function ConfirmationModalContent({
  onClose, onConfirm, title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", loading = false,
}: ConfirmationModalProps) {
  const styles = CONFIRMATION_STYLES[variant];
  const handleConfirm = async () => {
    if (loading) return;

    try {
      await onConfirm();
      onClose();
    } catch {
      // Caller owns user-facing error handling.
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 ${styles.icon}`}>
        <AlertTriangle size={24} />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 border border-border text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-secondary transition-colors rounded"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 text-xs tracking-[0.15em] uppercase font-medium transition-colors rounded disabled:opacity-60 ${styles.btn}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

const ConfirmationModal = (props: ConfirmationModalProps) => (
  <ModalShell
    isOpen={props.isOpen}
    onClose={props.onClose}
    panelClassName="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full shadow-xl"
  >
    <ConfirmationModalContent {...props} />
  </ModalShell>
);

export default ConfirmationModal;
