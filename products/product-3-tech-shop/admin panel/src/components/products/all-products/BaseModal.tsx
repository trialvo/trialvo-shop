// src/components/products/all-products/modals/BaseModal.tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "@/components/ui/modal/useModalTransition";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  widthClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
};

const OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const CLOSE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const EASE_STD = "cubic-bezier(0.4, 0, 0.2, 1)";

export default function BaseModal({
  open,
  title,
  description,
  widthClassName = "w-[980px]",
  children,
  footer,
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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        style={{
          opacity: isVisible ? 1 : 0,
          transition: isVisible
            ? `opacity 220ms ${EASE_STD}`
            : `opacity 180ms ${CLOSE_EASE}`,
        }}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative flex h-full w-full items-start justify-center overflow-y-auto">
        {/* Dialog */}
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
            "relative z-[1] m-4 flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:m-6 sm:max-h-[calc(100dvh-3rem)]",
            "rounded-xl border border-gray-200/80 bg-white shadow-2xl",
            "dark:border-gray-700/60 dark:bg-gray-900",
            widthClassName,
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="min-w-0 flex-1">
              {title ? (
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                "border border-gray-200 text-gray-500 transition-all",
                "hover:bg-gray-100 hover:text-gray-700",
                "dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
              )}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {children}
          </div>

          {/* Footer */}
          {footer ? (
            <div className="shrink-0 border-t border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-950/50">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
