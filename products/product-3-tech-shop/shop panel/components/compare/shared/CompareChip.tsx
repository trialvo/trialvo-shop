"use client";

import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CompareChipTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "muted";

type CompareChipProps = Readonly<{
  children: ReactNode;
  tone?: CompareChipTone;
  size?: "xs" | "sm";
  className?: string;
}>;

const toneClass: Record<CompareChipTone, string> = {
  default: "border-border bg-secondary text-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  success:
    "border-success/30 bg-success/10 text-success",
  warning:
    "border-warning/30 bg-warning/10 text-warning",
  destructive:
    "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
};

/**
 * Compact status chip — uses main-shop design tokens only.
 */
export function CompareChip({
  children,
  tone = "default",
  size = "sm",
  className,
}: CompareChipProps): ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border font-semibold leading-none",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
