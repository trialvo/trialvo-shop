"use client";

import * as React from "react";

const SCROLL_TOP_VISIBLE_EVENT = "shop:scroll-top-visible";
const THRESHOLD = 320;

export function useScrollTopVisible(): boolean {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      const next = window.scrollY > THRESHOLD;
      setVisible(next);
      window.dispatchEvent(
        new CustomEvent(SCROLL_TOP_VISIBLE_EVENT, { detail: { visible: next } }),
      );
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return visible;
}

export function useScrollTopVisibleListener(): boolean {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setVisible(window.scrollY > THRESHOLD);
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail;
      if (typeof detail?.visible === "boolean") setVisible(detail.visible);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener(SCROLL_TOP_VISIBLE_EVENT, onCustom);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener(SCROLL_TOP_VISIBLE_EVENT, onCustom);
    };
  }, []);

  return visible;
}
