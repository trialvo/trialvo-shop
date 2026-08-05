"use client";

import { useEffect, useState } from "react";

const DEFAULT_THRESHOLDS = [0, 0.25, 0.5, 0.75, 1];
const DEFAULT_ROOT_MARGIN = "-20% 0px -55% 0px";

/**
 * Tracks which section id is currently in view (scroll spy).
 * Uses IntersectionObserver — no scroll-event thrashing.
 */
export function useActiveSection(
  sectionIds: readonly string[],
  options?: Readonly<{ rootMargin?: string; threshold?: number | number[] }>,
): string {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const idsKey = sectionIds.join("|");
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;
  const threshold = options?.threshold ?? DEFAULT_THRESHOLDS;

  useEffect(() => {
    const ids = idsKey ? idsKey.split("|") : [];
    if (ids.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio);
          } else {
            visible.delete(id);
          }
        }

        if (visible.size === 0) return;

        // Prefer the most visible section; fall back to document order
        let bestId = ids[0] ?? "";
        let bestRatio = -1;
        for (const id of ids) {
          const ratio = visible.get(id);
          if (ratio !== undefined && ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        setActiveId(bestId);
      },
      {
        root: null,
        // Activate a bit before the section hits the top (sticky header offset)
        rootMargin,
        threshold,
      },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    // Hash on load
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && ids.includes(hash)) {
      setActiveId(hash);
    }

    return () => observer.disconnect();
  }, [idsKey, rootMargin, threshold]);

  return activeId;
}
