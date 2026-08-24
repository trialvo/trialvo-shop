"use client";

import * as React from "react";

/**
 * Hides chrome on scroll-down and shows it on scroll-up.
 * Uses a larger delta + short lock so layout reflow from show/hide
 * (header height / sticky offset) cannot flicker the state.
 */
export function useHideHeaderOnScroll(threshold = 80): boolean {
  const [hidden, setHidden] = React.useState(false);
  const lastY = React.useRef(0);
  const lockUntil = React.useRef(0);

  React.useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const now = Date.now();
      const delta = y - lastY.current;
      lastY.current = y;

      if (y < threshold) {
        setHidden(false);
        lockUntil.current = 0;
        return;
      }

      if (Math.abs(delta) < 14 || now < lockUntil.current) return;

      if (delta > 28) {
        setHidden((prev) => {
          if (!prev) lockUntil.current = now + 400;
          return true;
        });
      } else if (delta < -28) {
        setHidden((prev) => {
          if (prev) lockUntil.current = now + 400;
          return false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
