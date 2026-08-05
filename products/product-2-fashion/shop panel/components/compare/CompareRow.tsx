"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CompareRowProps {
  label: string;
  leftValue: React.ReactNode;
  rightValue: React.ReactNode;
  leftBetter?: boolean;
  rightBetter?: boolean;
  highlight?: boolean;
}

export default function CompareRow({
  label,
  leftValue,
  rightValue,
  leftBetter,
  rightBetter,
  highlight = false,
}: CompareRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_2fr_2fr] border-b border-black/[0.04] last:border-0",
        highlight && "bg-black/[0.01]",
      )}
    >
      <div className="flex items-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </div>

      <div
        className={cn(
          "flex items-center border-l border-black/[0.04] px-4 py-3 text-sm",
          leftBetter && "bg-emerald-50/70 font-semibold text-emerald-700",
        )}
      >
        <div className="flex w-full items-center gap-2">
          {leftBetter && (
            <span className="bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              BEST
            </span>
          )}
          <span className="min-w-0 flex-1">
            {leftValue ?? <span className="text-gray-300">—</span>}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center border-l border-black/[0.04] px-4 py-3 text-sm",
          rightBetter && "bg-emerald-50/70 font-semibold text-emerald-700",
        )}
      >
        <div className="flex w-full items-center gap-2">
          {rightBetter && (
            <span className="bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              BEST
            </span>
          )}
          <span className="min-w-0 flex-1">
            {rightValue ?? <span className="text-gray-300">—</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
