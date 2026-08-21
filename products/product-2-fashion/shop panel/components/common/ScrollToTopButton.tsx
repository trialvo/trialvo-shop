"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { FiArrowUp } from "react-icons/fi";

const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed right-4 z-[60] grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.16)]",
        "bottom-20 min-[768px]:bottom-8 min-[768px]:right-6",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <FiArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTopButton;
