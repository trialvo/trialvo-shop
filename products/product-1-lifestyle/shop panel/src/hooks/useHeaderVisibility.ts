"use client";

/**
 * useHeaderVisibility.ts — Track header hide/show state and dynamic height.
 *
 * Mirrors the Header component's scroll-based visibility logic so that
 * other sticky elements (e.g., filter sidebar) can sync their position
 * with the header's actual rendered height.
 *
 * Instead of using hardcoded pixel values, this hook reads the header's
 * real bounding rect on every scroll event, giving pixel-perfect alignment
 * regardless of announcement bar state, scroll compression, or responsive
 * breakpoints.
 *
 * Usage:
 *   const { isHeaderHidden, stickyTopPx } = useHeaderVisibility();
 *   <aside style={{ top: stickyTopPx }} />
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ── Constants — must match Header.tsx scroll thresholds ─────────────────────

/** Header hides when scrolling down past this Y threshold. */
const HEADER_HIDE_THRESHOLD_PX = 160;

/** Scroll Y beyond which the header is considered "scrolled" (compressed). */
const HEADER_SCROLLED_THRESHOLD_PX = 10;

/** Extra breathing room below the header bottom edge (px). */
const STICKY_GAP_PX = 16;

/** Fallback top offset when the header is hidden (px). */
const HIDDEN_TOP_PX = 20;

// ── Types ───────────────────────────────────────────────────────────────────

export interface HeaderVisibilityState {
  /**
   * Whether the header is currently hidden (translated off-screen).
   * True when scrolling down and past the hide threshold.
   */
  readonly isHeaderHidden: boolean;

  /**
   * Whether the page has been scrolled past the initial threshold,
   * causing the header to compress its height.
   */
  readonly isScrolled: boolean;

  /**
   * Computed sticky `top` value in pixels, derived from the header's
   * actual rendered bottom edge. Accounts for announcement bar, scroll
   * compression, and responsive breakpoints automatically.
   *
   * When header is visible: `headerBottomEdge + gap`
   * When header is hidden: small fixed value (~20px)
   */
  readonly stickyTopPx: number;

  /**
   * Computed `max-height` CSS value for sticky sidebars, ensuring
   * they never overflow the viewport.
   */
  readonly stickyMaxHeight: string;
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Track the header's visibility state and compute pixel-perfect sticky
 * offsets based on the header's real rendered dimensions.
 */
export function useHeaderVisibility(): HeaderVisibilityState {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stickyTopPx, setStickyTopPx] = useState(HIDDEN_TOP_PX);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement | null>(null);

  /**
   * Measure the header's actual bottom edge from the DOM.
   * Falls back to a sensible default if the header element isn't found.
   */
  const measureHeader = useCallback(() => {
    // Lazily find and cache the header element
    if (!headerRef.current) {
      headerRef.current = document.querySelector("header");
    }

    const header = headerRef.current;
    if (!header) return;

    const rect = header.getBoundingClientRect();

    // If the header is off-screen (hidden via -translate-y-full),
    // its bottom will be <= 0
    if (rect.bottom <= 0) {
      setStickyTopPx(HIDDEN_TOP_PX);
    } else {
      setStickyTopPx(rect.bottom + STICKY_GAP_PX);
    }
  }, []);

  useEffect(() => {
    let prevHidden = false;
    let prevScrolled = false;

    const onScroll = () => {
      const y = window.scrollY;

      const nextScrolled = y > HEADER_SCROLLED_THRESHOLD_PX;
      const nextHidden = y > lastScrollY.current && y > HEADER_HIDE_THRESHOLD_PX;

      lastScrollY.current = y;

      // Only trigger state updates when values actually change
      if (nextHidden !== prevHidden) {
        prevHidden = nextHidden;
        setIsHeaderHidden(nextHidden);
      }

      if (nextScrolled !== prevScrolled) {
        prevScrolled = nextScrolled;
        setIsScrolled(nextScrolled);
      }

      // Always measure the header's actual position for sticky offset
      measureHeader();
    };

    // Initial measurement after mount
    measureHeader();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [measureHeader]);

  // Recompute on window resize (header height can change at breakpoints)
  useEffect(() => {
    const onResize = () => measureHeader();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [measureHeader]);

  const stickyMaxHeight = `calc(100vh - ${stickyTopPx}px - ${STICKY_GAP_PX}px)`;

  return { isHeaderHidden, isScrolled, stickyTopPx, stickyMaxHeight };
}
