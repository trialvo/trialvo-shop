import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "@/components/ui/modal/useModalTransition";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;

  bodyClassName?: string;

  /** customize only specific modal UI */
  contentClassName?: string;
};

const OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const CLOSE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const EASE_STD = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function Modal({
  open,
  title,
  description,
  size = "md",
  onClose,
  footer,
  children,
  bodyClassName,
  contentClassName,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      const id = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setIsVisible(true)),
      );
      return () => window.cancelAnimationFrame(id);
    }

    setIsVisible(false);
  }, [open]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (!open) setIsMounted(false);
    },
    [open],
  );

  useEffect(() => {
    if (!isMounted) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isMounted]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!isMounted) return null;

  const sizeClass =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
        ? "max-w-3xl"
        : size === "xl"
          ? "max-w-5xl"
          : "max-w-xl";

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: isVisible
            ? `opacity 220ms ${EASE_STD}`
            : `opacity 180ms ${CLOSE_EASE}`,
        }}
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal"
      />

      {/* Modal */}
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
        className={cn(
          "relative z-[10000] my-2 sm:my-0 w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] bg-white shadow-theme-xs dark:bg-gray-900",
          "overflow-hidden", // ✅ IMPORTANT: clip header/footer so rounded corners show
          "rounded-xl", // default
          "flex flex-col",
          sizeClass,
          contentClassName // ✅ e.g. rounded-[6px]
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
              {description ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", bodyClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
