/**
 * useFlyToCart
 * Triggers a "fly to cart" bubble animation from a source element to a
 * target element (identified by DOM id).
 *
 * Usage:
 *   const { flyTo } = useFlyToCart();
 *   flyTo(buttonRef.current, "nav-cart-icon", "#e91e63");
 */

import { useCallback } from "react";

export type FlyTarget = "nav-cart-icon" | "nav-combo-btn";

interface FlyOptions {
  color?: string; // bubble bg color
  size?: number; // bubble size in px
  duration?: number; // ms
}

export function useFlyToCart() {
  const flyTo = useCallback(
    (
      sourceEl: HTMLElement | null,
      targetId: FlyTarget,
      opts: FlyOptions = {},
    ) => {
      if (!sourceEl) return;
      const target = document.getElementById(targetId);
      if (!target) return;

      const { color = "#e91e63", size = 52, duration = 950 } = opts;

      const from = sourceEl.getBoundingClientRect();
      const to = target.getBoundingClientRect();

      const startX = from.left + from.width / 2 - size / 2;
      const startY = from.top + from.height / 2 - size / 2;
      const endX = to.left + to.width / 2 - size / 2;
      const endY = to.top + to.height / 2 - size / 2;

      // Create bubble
      const bubble = document.createElement("div");
      Object.assign(bubble.style, {
        position: "fixed",
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: color,
        zIndex: "99999",
        pointerEvents: "none",
        transition: `all ${duration}ms cubic-bezier(0.25, 0.9, 0.3, 0.95)`,
        transform: "scale(1)",
        opacity: "0.92",
        boxShadow: `0 0 0 6px ${color}40, 0 4px 20px ${color}50`,
        border: `2px solid ${color}80`,
      });
      document.body.appendChild(bubble);

      // Force reflow so the initial position is painted
      bubble.getBoundingClientRect();

      // Animate to target
      bubble.style.left = `${endX}px`;
      bubble.style.top = `${endY}px`;
      bubble.style.transform = "scale(0.3)";
      bubble.style.opacity = "0";

      // Pulse the target
      target.style.transition = "transform 0.2s ease";
      setTimeout(() => {
        target.style.transform = "scale(1.35)";
        setTimeout(() => {
          target.style.transform = "scale(1)";
        }, 180);
      }, duration - 80);

      // Cleanup
      setTimeout(() => bubble.remove(), duration + 50);
    },
    [],
  );

  return { flyTo };
}
