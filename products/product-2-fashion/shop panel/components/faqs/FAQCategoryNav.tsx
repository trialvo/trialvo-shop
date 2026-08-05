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
    <aside className={cn("w-full col-span-12 sm:w-[290px] sm:col-span-3", className)}>
      <div className="space-y-3">
        {categories.map((c) => {
          const active = c.id === activeId;
          const Icon = c.icon;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                "flex w-full items-center text-base font-medium gap-3 border px-5 py-2.5 text-left transition cursor-pointer",
                "rounded-none",
                active
                  ? "border-black bg-black text-white"
                  : "border-[#F1f1f1] bg-[#F8F8F8] text-black hover:border-[#D0D0D0]"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-white" : "text-black"
                )}
              />
              <span className="text-base font-medium">{c.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default FAQCategoryNav;
