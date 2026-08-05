import { useCallback, useEffect, useState } from "react";
import type React from "react";

export const MODAL_OPEN_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
export const MODAL_CLOSE_EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
export const MODAL_STD_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

let bodyLockCount = 0;
let prevBodyOverflow = "";
let prevBodyPaddingRight = "";

function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

export function lockBodyScroll() {
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;

  if (bodyLockCount === 0) {
    const scrollbarW = getScrollbarWidth();
    prevBodyOverflow = document.body.style.overflow;
    prevBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbarW > 0 ? `${scrollbarW}px` : "";
  }

  bodyLockCount += 1;
}

export function unlockBodyScroll() {
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;
  if (bodyLockCount <= 0) return;

  bodyLockCount -= 1;
  if (bodyLockCount > 0) return;

  document.body.style.overflow = prevBodyOverflow;
  document.body.style.paddingRight = prevBodyPaddingRight;
  prevBodyOverflow = "";
  prevBodyPaddingRight = "";
}

export function useModalTransition(open: boolean) {
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

  return { isMounted, isVisible, handleTransitionEnd };
}

export function getModalBackdropStyle(
  isVisible: boolean,
): React.CSSProperties {
  return {
    opacity: isVisible ? 1 : 0,
    transition: isVisible
      ? `opacity 220ms ${MODAL_STD_EASE}`
      : `opacity 180ms ${MODAL_CLOSE_EASE}`,
  };
}

export function getModalDialogStyle(isVisible: boolean): React.CSSProperties {
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? "translateY(0) scale(1)"
      : "translateY(20px) scale(0.96)",
    transition: isVisible
      ? `opacity 260ms ${MODAL_OPEN_EASE}, transform 320ms ${MODAL_OPEN_EASE}`
      : `opacity 180ms ${MODAL_CLOSE_EASE}, transform 180ms ${MODAL_CLOSE_EASE}`,
    willChange: "opacity, transform",
  };
}
