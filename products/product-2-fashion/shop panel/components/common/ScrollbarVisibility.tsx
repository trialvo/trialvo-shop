"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";

const MIN_THUMB_PX = 40;
const EDGE_ZONE_PX = 24;

type ThumbState = {
  height: number;
  top: number;
  visible: boolean;
};

function getScrollMetrics() {
  const root = document.documentElement;
  const scrollHeight = root.scrollHeight;
  const clientHeight = root.clientHeight;
  const maxScroll = scrollHeight - clientHeight;
  const height = Math.max(MIN_THUMB_PX, Math.round(clientHeight * (clientHeight / scrollHeight)));
  const maxTop = Math.max(0, clientHeight - height);
  return { root, scrollHeight, clientHeight, maxScroll, height, maxTop };
}

export default function ScrollbarVisibility() {
  const isMobile = useIsMobile();
  const [thumb, setThumb] = useState<ThumbState>({
    height: 0,
    top: 0,
    visible: false,
  });

  const [isNearEdge, setIsNearEdge] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startTop: number } | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isMobile || typeof document === "undefined") return;

    let rafId = 0;
    const root = document.documentElement;

    const updateThumb = () => {
      const { maxScroll, height, maxTop } = getScrollMetrics();

      if (maxScroll <= 0) {
        setThumb({ height: 0, top: 0, visible: false });
        return;
      }

      const scrollTop = root.scrollTop || document.body.scrollTop || 0;
      const top = Math.round((scrollTop / maxScroll) * maxTop);
      setThumb({ height, top, visible: true });
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateThumb();
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) return;
      const fromRight = window.innerWidth - e.clientX;
      setIsNearEdge(fromRight <= EDGE_ZONE_PX);
    };

    const onPointerLeaveWindow = () => {
      if (!isDragging) setIsNearEdge(false);
    };

    requestUpdate();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeaveWindow);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => requestUpdate())
        : null;

    if (resizeObserver) {
      resizeObserver.observe(document.body);
      resizeObserver.observe(root);
    }

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeaveWindow);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isMobile, isDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { root, maxScroll, maxTop } = getScrollMetrics();
      if (maxScroll <= 0 || maxTop <= 0) return;

      const deltaY = e.clientY - dragRef.current.startY;
      const nextTop = Math.min(maxTop, Math.max(0, dragRef.current.startTop + deltaY));
      root.scrollTop = (nextTop / maxTop) * maxScroll;
    };

    const onUp = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging]);

  if (isMobile) {
    return null;
  }

  const show = thumb.visible && (isNearEdge || isDragging);

  const scrollToClientY = (clientY: number) => {
    const { root, maxScroll, height, maxTop } = getScrollMetrics();
    if (maxScroll <= 0 || maxTop <= 0) return;
    const nextTop = Math.min(maxTop, Math.max(0, clientY - height / 2));
    root.scrollTop = (nextTop / maxTop) * maxScroll;
  };

  return (
    <div
      className="overlay-scrollbar"
      data-visible={show ? "true" : "false"}
      data-dragging={isDragging ? "true" : "false"}
      aria-hidden="true"
      suppressHydrationWarning
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest(".overlay-scrollbar-thumb")) return;
        if (!thumb.visible) return;
        e.preventDefault();
        scrollToClientY(e.clientY);
      }}
    >
      <div
        ref={thumbRef}
        className="overlay-scrollbar-thumb"
        suppressHydrationWarning
        style={{
          height: `${thumb.height}px`,
          transform: `translateY(${thumb.top}px)`,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragRef.current = { startY: e.clientY, startTop: thumb.top };
          setIsDragging(true);
          setIsNearEdge(true);
          document.body.style.userSelect = "none";
          document.body.style.cursor = "grabbing";
          thumbRef.current?.setPointerCapture?.(e.pointerId);
        }}
      />
    </div>
  );
}
