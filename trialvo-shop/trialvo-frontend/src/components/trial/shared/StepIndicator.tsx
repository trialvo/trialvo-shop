"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact "1 ─ 2 ─ 3" header for the wizard. Works down to 320px. */
export function StepIndicator({
  steps,
  current,
  onStepSelect,
  className,
}: Readonly<{
  steps: string[];
  current: number;
  /** Jump to an earlier step (completed only). Used so users can edit answers. */
  onStepSelect?: (index: number) => void;
  className?: string;
}>) {
  return (
    <ol className={cn("flex items-center gap-1.5", className)} aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const canJump = Boolean(onStepSelect) && done;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5 last:flex-none">
            <span className="flex min-w-0 items-center gap-1.5">
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(i)}
                  aria-label={`Go back to ${label}`}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    "bg-accent text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </button>
              ) : (
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    done && "bg-accent text-accent-foreground",
                    active && "bg-foreground text-background",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
              )}
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(i)}
                  className={cn(
                    "truncate text-xs font-semibold text-accent-strong underline-offset-2 hover:underline",
                    "hidden sm:inline",
                  )}
                >
                  {label}
                </button>
              ) : (
                <span
                  className={cn(
                    "truncate text-xs font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                    !active && "hidden sm:inline",
                  )}
                >
                  {label}
                </span>
              )}
            </span>
            {i < steps.length - 1 ? (
              <span aria-hidden="true" className={cn("h-px min-w-3 flex-1 rounded", done ? "bg-accent" : "bg-border")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default StepIndicator;
