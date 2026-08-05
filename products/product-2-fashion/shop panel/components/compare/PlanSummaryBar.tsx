"use client";

import * as React from "react";
import { FiShoppingBag, FiCheck, FiAlertTriangle } from "react-icons/fi";

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
    <div className="sticky bottom-0 z-20 border-t border-black/10 bg-white px-5 py-3 shadow-[0px_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-black">
            <FiShoppingBag size={13} />
            {totalItems} item{totalItems !== 1 ? "s" : ""} planned
          </span>

          <span className="text-gray-300">|</span>

          <span className="font-semibold text-black">
            ৳{totalSpend.toLocaleString()}{" "}
            <span className="font-normal text-gray-400">
              / ৳{budget.toLocaleString()}
            </span>
          </span>

          <span className="text-gray-300">|</span>

          {overBudget ? (
            <span className="inline-flex items-center gap-1 font-semibold text-red-500">
              <FiAlertTriangle size={12} />
              Over by ৳{Math.abs(remaining).toLocaleString()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <FiCheck size={12} />
              ৳{remaining.toLocaleString()} remaining
            </span>
          )}
        </div>

        {/* Right: progress bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden bg-gray-100 sm:w-48">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                overBudget ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-black"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-400">
            {Math.round(pct)}%
          </span>
        </div>
      </div>
    </div>
  );
}
