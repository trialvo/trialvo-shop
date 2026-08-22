"use client";

import { useEffect } from "react";

const HIDE_AFTER_MS = 900;

export default function ScrollbarVisibility() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    let timer = 0;

    const onScroll = () => {
      root.classList.add("is-scrolling");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        root.classList.remove("is-scrolling");
      }, HIDE_AFTER_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      root.classList.remove("is-scrolling");
    };
  }, []);

  return null;
}
