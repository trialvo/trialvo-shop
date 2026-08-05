import { useCallback, useEffect, useRef, useState } from "react";
import { lockBodyScroll, unlockBodyScroll } from "@/components/ui/modal/useModalTransition";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  titleId?: string;
}

const OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const CLOSE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const EASE_STD = "cubic-bezier(0.4, 0, 0.2, 1)";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
  titleId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElRef = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  /* ---------------- Mount / Unmount with animation ---------------- */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const id = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setVisible(true)),
      );
      return () => window.cancelAnimationFrame(id);
    }

    setVisible(false);
  }, [isOpen]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (!isOpen) setMounted(false);
    },
    [isOpen],
  );

  /* ---------------- ESC key close ---------------- */
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  /* ---------------- BODY SCROLL LOCK (NO LAYOUT SHIFT) ---------------- */
  useEffect(() => {
    if (!mounted) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [mounted]);

  /* ---------------- Focus management ---------------- */
  useEffect(() => {
    if (!isOpen) return;

    lastActiveElRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const root = modalRef.current;
      if (!root) return;

      const focusable = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      (focusable[0] ?? root).focus();
    };

    const t = window.setTimeout(focusFirst, 50);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) {
      lastActiveElRef.current?.focus?.();
    }
  }, [mounted]);

  if (!mounted) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative my-2 sm:my-0 w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10";

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-6">
      {/* Backdrop */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: visible
            ? `opacity 220ms ${EASE_STD}`
            : `opacity 180ms ${CLOSE_EASE}`,
        }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.96)",
          transition: visible
            ? `opacity 260ms ${OPEN_EASE}, transform 320ms ${OPEN_EASE}`
            : `opacity 180ms ${CLOSE_EASE}, transform 180ms ${CLOSE_EASE}`,
          willChange: "opacity, transform",
        }}
        className={`${contentClasses} ${className}`}
      >
        {showCloseButton && !isFullscreen && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
          >
            ✕
          </button>
        )}

        {children}
      </div>
    </div>
  );
};
