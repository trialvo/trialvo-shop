"use client";

import { useAppSelector } from "@/redux/hooks";
import React from "react";
import { MODAL_REGISTRY } from "./ModalRegistry";

function isInsideModal(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[role="dialog"]') ||
      target.closest("[data-slot='dialog-content']") ||
      target.closest("[data-radix-scroll-area-viewport]"),
  );
}

/**
 * Freeze background scroll without changing layout.
 * Radix remove-scroll uses overflow/padding which breaks sticky header/sidebar
 * after the page has been scrolled — we cancel that and block scroll events instead.
 */
function useStableModalScrollFreeze(active: boolean) {
  React.useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    const scrollY = window.scrollY;
    root.classList.add("modal-scroll-lock");

    const freezeScrollPosition = () => {
      if (window.scrollY !== scrollY) {
        window.scrollTo(0, scrollY);
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (isInsideModal(event.target)) return;
      event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isInsideModal(event.target)) return;
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isInsideModal(event.target)) return;
      const keys = new Set([
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ]);
      if (keys.has(event.key)) {
        event.preventDefault();
      }
    };

    freezeScrollPosition();
    const raf = window.requestAnimationFrame(freezeScrollPosition);

    window.addEventListener("scroll", freezeScrollPosition, { passive: true });
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", freezeScrollPosition);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("keydown", onKeyDown);
      root.classList.remove("modal-scroll-lock");
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

const ModalManager: React.FC = () => {
  const stack = useAppSelector((s) => s.modalManager.stack);
  const hasOpenModal = stack.length > 0;

  useStableModalScrollFreeze(hasOpenModal);

  if (!stack.length) return null;

  return (
    <>
      {stack.map((item, idx) => {
        const Entry = MODAL_REGISTRY[item.key];
        const isTop = idx === stack.length - 1;
        const zIndex = 100 + idx * 10;

        return (
          <Entry
            key={item.id}
            modalId={item.id}
            isTop={isTop}
            zIndex={zIndex}
            payload={item.payload}
          />
        );
      })}
    </>
  );
};

export default ModalManager;
