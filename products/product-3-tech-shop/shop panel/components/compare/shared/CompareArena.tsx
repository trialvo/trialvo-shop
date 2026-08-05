"use client";

import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CompareVsBadgeProps = Readonly<{
  size?: "sm" | "md";
  className?: string;
  pulse?: boolean;
}>;

export function CompareVsBadge({
  size = "md",
  className,
  pulse = true,
}: CompareVsBadgeProps): ReactElement {
  return (
    <span
      className={cn(
        "pointer-events-none flex items-center justify-center rounded-sm border-2 border-primary/25 bg-card font-heading font-bold text-primary shadow-product-hover",
        size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-xs",
        pulse && "animate-vs-pulse",
        className,
      )}
      aria-hidden
    >
      VS
    </span>
  );
}

type CompareArenaProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/** Unified surface that holds the A/B pickers. */
export function CompareArena({
  children,
  className,
}: CompareArenaProps): ReactElement {
  return (
    <div
      className={cn(
        // overflow-visible so product search dropdown is never clipped
        "relative overflow-visible rounded-sm border border-border compare-stage shadow-product",
        className,
      )}
    >
      <div
        aria-hidden
        className="compare-grid-mask pointer-events-none absolute inset-0 rounded-sm"
      />
      <div className="relative overflow-visible p-3 sm:p-4">{children}</div>
    </div>
  );
}
