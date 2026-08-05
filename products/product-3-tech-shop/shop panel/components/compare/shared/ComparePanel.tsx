"use client";

import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ComparePanelProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/** Standard card surface for compare / budget sections. */
export function ComparePanel({
  children,
  className,
}: ComparePanelProps): ReactElement {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-card shadow-product",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CompareSectionHeaderProps = Readonly<{
  icon: ReactNode;
  label: string;
}>;

export function CompareSectionHeader({
  icon,
  label,
}: CompareSectionHeaderProps): ReactElement {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-sm border border-border bg-secondary/40 px-4 py-3 shadow-product">
      <span className="text-primary">{icon}</span>
      <span className="font-heading text-[11px] font-bold uppercase tracking-widest text-foreground">
        {label}
      </span>
    </div>
  );
}
