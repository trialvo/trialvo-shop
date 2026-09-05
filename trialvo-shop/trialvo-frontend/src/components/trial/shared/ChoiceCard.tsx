"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "@/components/section";
import { cn } from "@/lib/utils";

/**
 * Radio-style card used for every "pick one" decision in the trial flows
 * (hosting source, VPS/cPanel, months). One component so the selected state,
 * focus ring and tap target are identical everywhere.
 */
export function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  body,
  meta,
  disabled,
  compact = false,
  className,
  children,
}: Readonly<{
  selected: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-xl border text-left transition-all",
        compact ? "px-3 py-3" : "px-4 py-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_hsl(var(--accent))]"
          : "border-border bg-card hover:border-foreground/25 hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {icon ? (
        <IconTile icon={icon} size={compact ? "sm" : "md"} tone={selected ? "accent" : "neutral"} />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-[15px] font-bold tracking-tight text-foreground">{title}</span>
          {meta ? <span className="shrink-0 text-xs font-semibold text-muted-foreground">{meta}</span> : null}
        </span>
        {body ? <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{body}</span> : null}
        {children}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background",
        )}
      >
        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export default ChoiceCard;
