"use client";

import { useEffect, useState } from "react";

export type HeaderScrollState = Readonly<{
  /** True once the page has scrolled past the top threshold (shadow / blur). */
  scrolled: boolean;
}>;

const TOP_SHADOW_Y = 40;

/**
 * Tracks sticky-header scroll chrome (shadow / blur once past the top).
 * Bottom category nav stays visible at all times.
 */
export function useHeaderScrollState(): HeaderScrollState {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > TOP_SHADOW_Y);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { scrolled };
}
