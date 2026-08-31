"use client";

import { useScrollTopVisible } from "@/hooks/useScrollTopVisible";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiArrowUp } from "react-icons/fi";

const SCROLL_TO_TOP_EVENT = "shop:scroll-to-top";
const MOTION = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

type Props = {
  /** When true, renders as an in-flow stack item (mobile FAB column). */
  stacked?: boolean;
  className?: string;
};

const ScrollToTopButton: React.FC<Props> = ({ stacked = false, className }) => {
  const visible = useScrollTopVisible();

  if (stacked) {
    return (
      <button
        type="button"
        aria-label="Scroll to top"
        onClick={() => {
          window.dispatchEvent(new Event(SCROLL_TO_TOP_EVENT));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full border border-black/8 bg-white text-[#191919] shadow-[0_8px_24px_rgba(20,16,12,0.12)]",
          "transition-transform active:scale-95",
          MOTION,
          className,
        )}
      >
        <FiArrowUp className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => {
        window.dispatchEvent(new Event(SCROLL_TO_TOP_EVENT));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={cn(
        "fixed right-4 z-[60] grid h-11 w-11 place-items-center rounded-full bg-[#191919] text-white shadow-[0_8px_24px_rgba(20,16,12,0.18)]",
        "bottom-20 max-[500px]:hidden min-[768px]:bottom-8 min-[768px]:right-6",
        "transition-[opacity,transform]",
        MOTION,
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
        className,
      )}
    >
      <FiArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTopButton;
