"use client";

import { cn } from "@/lib/utils";
import React from "react";
import type { FAQCategory } from "./types";

type Props = {
  categories: FAQCategory[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

const FAQCategoryNav: React.FC<Props> = ({
  categories,
  activeId,
  onChange,
  className,
}) => {
  return (
    <aside className={cn("w-full min-w-0", className)}>
      {/* Mobile: horizontal chips */}
      <div className="min-[768px]:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const active = c.id === activeId;
            const Icon = c.icon;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[#191919] text-white"
                    : "bg-[#F3F1ED] text-[#5F5F5F] hover:bg-[#EAE6DF] hover:text-[#191919]",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: vertical list */}
      <nav
        aria-label="FAQ topics"
        className="hidden min-[768px]:block"
      >
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
          Browse topics
        </p>
        <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
          {categories.map((c, index) => {
            const active = c.id === activeId;
            const Icon = c.icon;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors",
                  index > 0 && "border-t border-black/6",
                  active
                    ? "bg-[#191919] text-white"
                    : "bg-white text-[#191919] hover:bg-[#FAF8F5]",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg",
                    active ? "bg-white/10" : "bg-[#F3F1ED]",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    active ? "text-white/60" : "text-[#A0A0A0]",
                  )}
                >
                  {c.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default FAQCategoryNav;
