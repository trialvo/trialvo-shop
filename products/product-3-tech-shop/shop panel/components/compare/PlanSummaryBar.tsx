"use client";

import * as React from "react";
import { AlertTriangle, Check, ShoppingBag } from "lucide-react";

interface PlanSummaryBarProps {
  budget: number;
  totalSpend: number;
  totalItems: number;
  remaining: number;
  overBudget: boolean;
}

export default function PlanSummaryBar({
  budget,
  totalSpend,
  totalItems,
  remaining,
  overBudget,
}: PlanSummaryBarProps) {
  const pct = budget > 0 ? Math.min(100, (totalSpend / budget) * 100) : 0;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-card px-5 py-3 shadow-[0px_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <ShoppingBag size={13} />
            {totalItems} item{totalItems !== 1 ? "s" : ""} planned
          </span>

          <span className="text-muted-foreground/50">|</span>

          <span className="font-semibold text-foreground">
            ৳{totalSpend.toLocaleString()}{" "}
            <span className="font-normal text-muted-foreground">
              / ৳{budget.toLocaleString()}
            </span>
          </span>

          <span className="text-muted-foreground/50">|</span>

          {overBudget ? (
            <span className="inline-flex items-center gap-1 font-semibold text-destructive">
              <AlertTriangle size={12} />
              Over by ৳{Math.abs(remaining).toLocaleString()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-success">
              <Check size={12} />
              ৳{remaining.toLocaleString()} remaining
            </span>
          )}
        </div>

        {/* Right: progress bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden bg-secondary sm:w-48">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                overBudget ? "bg-destructive/50" : pct > 80 ? "bg-warning" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    </div>
  );
}
