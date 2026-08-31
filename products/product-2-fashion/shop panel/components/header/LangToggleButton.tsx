"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import React from "react";

type Lang = "bn" | "en";

const OPTIONS: { id: Lang; label: string; ariaLabel: string; font: string }[] = [
  {
    id: "bn",
    label: "বাংলা",
    ariaLabel: "বাংলায় দেখুন",
    font: "var(--font-hind-siliguri, sans-serif)",
  },
  {
    id: "en",
    label: "English",
    ariaLabel: "Switch to English",
    font: "var(--font-inter, Inter, ui-sans-serif, sans-serif)",
  },
];

const LangToggleButton: React.FC = () => {
  const { language, setLanguage, isLangReady } = useLanguage();
  const activeIndex = language === "bn" ? 0 : 1;

  if (!isLangReady) {
    return <Skeleton className="h-8 w-[128px] rounded-full" />;
  }

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="relative inline-grid h-8 shrink-0 grid-cols-2 rounded-full bg-[#F3F1ED] p-0.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#191919] shadow-[0_1px_3px_rgba(20,16,12,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {OPTIONS.map((opt, index) => {
        const isActive = activeIndex === index;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isActive}
            aria-label={opt.ariaLabel}
            onClick={() => setLanguage(opt.id)}
            className={cn(
              "relative z-10 inline-flex h-7 min-w-[58px] cursor-pointer items-center justify-center rounded-full px-3 text-[11px] font-semibold tracking-[0.02em] select-none",
              "transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              isActive ? "text-white" : "text-[#6A6678] hover:text-[#191919]",
            )}
            style={{ fontFamily: opt.font }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default LangToggleButton;
