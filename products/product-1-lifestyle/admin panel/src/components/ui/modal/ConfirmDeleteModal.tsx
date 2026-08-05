// src/components/ui/modals/ConfirmDeleteModal.tsx
"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "@/components/ui/modal/useModalTransition";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const CLOSE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const EASE_STD = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function ConfirmDeleteModal({
  open,
  title = "Delete item?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      const id = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setIsVisible(true)),
      );
      return () => window.cancelAnimationFrame(id);
    }

    setIsVisible(false);
  }, [open]);

  const handleTransitionEnd = React.useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (!open) setIsMounted(false);
    },
    [open],
  );

  React.useEffect(() => {
    if (!isMounted) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isMounted]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose, open]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: isVisible
            ? `opacity 220ms ${EASE_STD}`
            : `opacity 180ms ${CLOSE_EASE}`,
        }}
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.96)",
          transition: isVisible
            ? `opacity 260ms ${OPEN_EASE}, transform 320ms ${OPEN_EASE}`
            : `opacity 180ms ${CLOSE_EASE}, transform 180ms ${CLOSE_EASE}`,
          willChange: "opacity, transform",
        }}
        className="relative w-full max-w-[520px] overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!loading) onClose();
            }}
            disabled={loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={cn("bg-error-600 hover:bg-error-700")}
            >
              {loading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
