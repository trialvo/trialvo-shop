"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the instant-demo and own-domain trial dialogs.
 *
 * The stock DialogContent is a single scroll box. These wizards are tall on
 * a phone, so the close button and the Next/Submit actions must stay pinned
 * while only the middle scrolls. This shell is a flex column:
 *   header (shrink-0) → body (flex-1, overflow) → optional footer (shrink-0)
 */
export function TrialModalShell({
  open,
  onOpenChange,
  size = "md",
  icon,
  eyebrow,
  badge,
  title,
  description,
  headerExtra,
  footer,
  children,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "md" | "lg";
  icon?: LucideIcon;
  eyebrow: ReactNode;
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}>) {
  const Icon = icon;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Replace the default grid + overflow-y-auto so children control scroll.
          // Height follows content. max-h only kicks in on a phone / short
          // viewport so the pinned footer never falls off screen.
          "flex !h-auto max-h-[min(92dvh,820px)] w-[calc(100%-0.75rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-soft-xl sm:w-full sm:rounded-3xl sm:p-0",
          size === "lg" ? "max-w-xl" : "max-w-lg",
          // Close button: 36px circle that never sits on the eyebrow.
          "[&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-muted/70 [&>button]:opacity-100 [&>button]:hover:bg-muted",
        )}
      >
        <div className="shrink-0 border-b border-border px-5 pb-4 pr-14 pt-5 sm:px-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase leading-none tracking-[0.14em] text-accent-strong">
                {icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {eyebrow}
              </span>
              {badge ? (
                <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent-strong">
                  {badge}
                </span>
              ) : null}
            </div>
            <DialogTitle className="font-display text-xl font-bold leading-tight tracking-tight">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription asChild>
                <div className="text-sm leading-6 text-muted-foreground">{description}</div>
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{typeof title === "string" ? title : "Trial"}</DialogDescription>
            )}
          </DialogHeader>
          {headerExtra}
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border bg-background/95 px-5 py-3.5 backdrop-blur-sm sm:px-6">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Compact fact chips used under the domain-wizard title instead of a wrapping sentence. */
export function TrialModalFacts({ items }: Readonly<{ items: string[] }>) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default TrialModalShell;
