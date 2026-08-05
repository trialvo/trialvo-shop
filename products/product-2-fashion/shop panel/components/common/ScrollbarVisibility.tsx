"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";

const SCROLLING_CLASS = "is-scrolling";
const SCROLLING_TIMEOUT_MS = 600;
const MIN_THUMB_PX = 28;

type ThumbState = {
  height: number;
  top: number;
  visible: boolean;
};

export default function ScrollbarVisibility() {
  const isMobile = useIsMobile();
  const [thumb, setThumb] = useState<ThumbState>({
    height: 0,
    top: 0,
    visible: false,
  });

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMobile || typeof document === "undefined") return;

    let timeoutId: number | null = null;
    let rafId = 0;
    const root = document.documentElement;

    const updateThumb = () => {
      const scrollHeight = root.scrollHeight;
      const clientHeight = root.clientHeight;

      if (scrollHeight <= clientHeight) {
        setThumb({ height: 0, top: 0, visible: false });
        return;
      }

      const trackHeight = clientHeight;
      const ratio = clientHeight / scrollHeight;
      const height = Math.max(MIN_THUMB_PX, Math.round(trackHeight * ratio));
      const maxTop = trackHeight - height;
      const scrollTop = root.scrollTop || document.body.scrollTop || 0;
      const top = Math.round((scrollTop / (scrollHeight - clientHeight)) * maxTop);

      setThumb({ height, top, visible: true });
    };

    const requestUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateThumb();
      });
    };

    const handleScrollStart = () => {
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, SCROLLING_TIMEOUT_MS);
    };

    const handleScroll = () => {
      root.classList.add(SCROLLING_CLASS);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        root.classList.remove(SCROLLING_CLASS);
        timeoutId = null;
      }, SCROLLING_TIMEOUT_MS);

      handleScrollStart();
      requestUpdate();
    };

    requestUpdate();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", requestUpdate);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => requestUpdate())
        : null;

    if (resizeObserver) {
      resizeObserver.observe(document.body);
      resizeObserver.observe(root);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", requestUpdate);
      if (resizeObserver) resizeObserver.disconnect();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMobile]);

  if (isMobile) {
    return null;
  }

  return (
    <div
      className="overlay-scrollbar"
      data-visible={isScrolling ? "true" : "false"}
      aria-hidden="true"
      suppressHydrationWarning
      style={{
        opacity: isScrolling ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      <div
        className="overlay-scrollbar-thumb"
        suppressHydrationWarning
        style={{
          height: `${thumb.height}px`,
          transform: `translateY(${thumb.top}px)`,
          opacity: isScrolling ? 1 : 0.5,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
}
