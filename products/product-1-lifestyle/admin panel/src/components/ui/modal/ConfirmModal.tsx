import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, X, ShieldAlert } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/components/ui/modal/useModalTransition";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;

  title?: string;
  subtitle?: React.ReactNode;
  message?: React.ReactNode;
  consequenceLines?: React.ReactNode[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  zIndexClassName?: string;
};

// ─── Easings ─────────────────────────────────────────────────────────────────

// Open: spring with slight overshoot → feels alive
const OPEN_EASE  = "cubic-bezier(0.34, 1.56, 0.64, 1)";
// Close: smooth ease-out → no bounce, no shake
const CLOSE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
// Hover/color transitions
const EASE_STD   = "cubic-bezier(0.4, 0, 0.2, 1)";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Are you sure?",
  subtitle = "This action is permanent and cannot be undone.",
  message,
  consequenceLines = [
    "Selected data will be permanently removed",
    "Any related records may be affected",
    "This cannot be recovered",
  ],
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  zIndexClassName = "z-[999]",
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // isMounted  → DOM presence (stays true during exit animation)
  // isVisible  → CSS animation state (lags one frame behind isMounted)
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // ── Open / close lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setIsMounted(true);
      // Two-frame trick: mount first at opacity-0, then flip visible → CSS transition fires
      const id = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setIsVisible(true)),
      );
      return () => window.cancelAnimationFrame(id);
    } else {
      setIsVisible(false); // begin exit; isMounted cleared in onTransitionEnd
    }
  }, [open]);

  // Only unmount AFTER the dialog's OWN transition ends (not bubbled child events)
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      // Guard: only respond to transitions on THIS element, not children that bubble
      if (e.target !== e.currentTarget) return;
      if (!open) setIsMounted(false);
    },
    [open],
  );

  // ── Scroll lock with scrollbar-width compensation ──────────────────────────
  // Tied to isMounted so body stays locked for the full duration of exit animation.
  // paddingRight compensates for the missing scrollbar so the page doesn't shift.
  useEffect(() => {
    if (!isMounted) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isMounted]);

  // ── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

  if (!isMounted) return null;

  const isDanger = variant === "danger";

  // ── Child section animation helper ────────────────────────────────────────
  // On open:  spring in with staggered delay
  // On close: fast smooth fade-out (no snap, no spring overshoot)
  const childAnim = (delayMs: number): React.CSSProperties => ({
    opacity:    isVisible ? 1 : 0,
    transform:  isVisible ? "translateY(0)" : "translateY(6px)",
    transition: isVisible
      ? `opacity 260ms ${OPEN_EASE} ${delayMs}ms, transform 280ms ${OPEN_EASE} ${delayMs}ms`
      : `opacity 140ms ${CLOSE_EASE}, transform 140ms ${CLOSE_EASE}`,
  });

  const modalNode = (
    <div className={cn("fixed inset-0 flex items-center justify-center px-4", zIndexClassName)}>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          opacity:    isVisible ? 1 : 0,
          transition: isVisible
            ? `opacity 220ms ${EASE_STD}`
            : `opacity 180ms ${CLOSE_EASE}`,
        }}
        className="absolute inset-0 bg-black/50 backdrop-blur-[0.5px]"
        onClick={() => { if (!loading) onClose(); }}
      />

      {/* ── Dialog ────────────────────────────────────────────────────────── */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onTransitionEnd={handleTransitionEnd}
        style={{
          opacity:   isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: isVisible
            ? `opacity 260ms ${OPEN_EASE}, transform 320ms ${OPEN_EASE}`
            : `opacity 180ms ${CLOSE_EASE}, transform 180ms ${CLOSE_EASE}`,
          willChange: "opacity, transform",
        }}
        className={cn(
          "relative w-full max-w-sm overflow-hidden rounded-2xl",
          "bg-white dark:bg-gray-900",
          "shadow-[0_0_0_1px_rgba(16,24,40,0.06),0_8px_16px_-4px_rgba(16,24,40,0.08),0_24px_56px_-12px_rgba(16,24,40,0.18)]",
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_16px_-4px_rgba(0,0,0,0.35),0_24px_56px_-12px_rgba(0,0,0,0.55)]",
        )}
      >
        {/* ── Gradient accent bar ─────────────────────────────────────────── */}
        <div className={cn(
          "h-1 w-full",
          isDanger
            ? "bg-gradient-to-r from-red-400 via-red-500 to-rose-500"
            : "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
        )} />

        {/* ── Close button ───────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => { if (!loading) onClose(); }}
          disabled={loading}
          aria-label="Close"
          className={cn(
            "absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full",
            "border border-gray-200 bg-gray-50 text-gray-400",
            "hover:border-gray-300 hover:bg-gray-100 hover:text-gray-600",
            "transition-all duration-150",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-300",
            loading && "pointer-events-none opacity-40",
          )}
        >
          <X size={13} />
        </button>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 p-6 pt-5">

          {/* Icon + title */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              style={{
                opacity:    isVisible ? 1 : 0,
                transform:  isVisible ? "scale(1)" : "scale(0.7)",
                transition: isVisible
                  ? `opacity 300ms ${OPEN_EASE} 60ms, transform 360ms ${OPEN_EASE} 60ms`
                  : `opacity 130ms ${CLOSE_EASE}, transform 130ms ${CLOSE_EASE}`,
              }}
              className={cn(
                "relative flex h-16 w-16 items-center justify-center rounded-2xl",
                isDanger ? "bg-red-50 dark:bg-red-500/10" : "bg-amber-50 dark:bg-amber-500/10",
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-2xl",
                isDanger
                  ? "shadow-[0_0_0_6px_rgba(239,68,68,0.12)] dark:shadow-[0_0_0_6px_rgba(239,68,68,0.2)]"
                  : "shadow-[0_0_0_6px_rgba(245,158,11,0.12)] dark:shadow-[0_0_0_6px_rgba(245,158,11,0.2)]",
              )} />
              {isDanger
                ? <Trash2 size={28} className="text-red-500 dark:text-red-400" />
                : <AlertTriangle size={28} className="text-amber-500 dark:text-amber-400" />
              }
            </div>

            <div style={childAnim(100)}>
              <h3
                id="confirm-modal-title"
                className="text-[15px] font-bold text-gray-900 dark:text-white"
              >
                {title}
              </h3>
              {subtitle ? (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {/* Product name callout */}
          {message ? (
            <div
              style={childAnim(150)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 border",
                isDanger
                  ? "border-red-100 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/[0.07]"
                  : "border-amber-100 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/[0.07]",
              )}
            >
              <ShieldAlert
                size={16}
                className={isDanger
                  ? "shrink-0 text-red-400 dark:text-red-500"
                  : "shrink-0 text-amber-400 dark:text-amber-500"
                }
              />
              <span className="min-w-0 break-words text-sm font-semibold text-gray-800 dark:text-gray-200">
                {message}
              </span>
            </div>
          ) : null}

          {/* Consequences list */}
          {consequenceLines.length ? (
            <div
              style={childAnim(200)}
              className={cn(
                "rounded-xl border px-4 py-3 space-y-1.5",
                "border-gray-100 bg-gray-50 dark:border-gray-700/60 dark:bg-gray-800/50",
              )}
            >
              {consequenceLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn(
                    "mt-px h-1.5 w-1.5 shrink-0 rounded-full",
                    isDanger ? "bg-red-400" : "bg-amber-400",
                  )} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{line}</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Action buttons */}
          <div style={childAnim(240)} className="flex gap-2.5 pt-1">
            {/* Cancel */}
            <button
              type="button"
              onClick={() => { if (!loading) onClose(); }}
              disabled={loading}
              className={cn(
                "flex flex-1 items-center justify-center rounded-xl border px-4 py-2.5",
                "text-sm font-semibold",
                "border-gray-200 bg-white text-gray-700",
                "hover:border-gray-300 hover:bg-gray-50",
                "transition-colors duration-150",
                "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
                "dark:hover:border-gray-600 dark:hover:bg-gray-700",
                loading && "pointer-events-none opacity-40",
              )}
            >
              {cancelLabel}
            </button>

            {/* Confirm / Delete */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                "text-sm font-semibold text-white",
                "shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
                "active:scale-[0.98] transition-all duration-100",
                isDanger
                  ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
                  : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
                loading && "pointer-events-none opacity-70",
              )}
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Deleting…</span>
                </>
              ) : (
                <>
                  {isDanger ? <Trash2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalNode;
  return createPortal(modalNode, document.body);
}
