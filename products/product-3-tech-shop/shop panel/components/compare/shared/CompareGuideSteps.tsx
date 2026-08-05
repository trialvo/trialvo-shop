"use client";

import type { ReactElement } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CompareGuideStepsProps = Readonly<{
  filledCount: number;
  bothLoaded?: boolean;
}>;

const STEPS = [
  { id: 1, label: "Choose A", short: "A" },
  { id: 2, label: "Choose B", short: "B" },
  { id: 3, label: "Compare", short: "✓" },
] as const;

/**
 * Compact horizontal progress rail — less clutter, clearer status.
 */
export function CompareGuideSteps({
  filledCount,
  bothLoaded = false,
}: CompareGuideStepsProps): ReactElement {
  const activeStep = bothLoaded ? 3 : Math.min(filledCount + 1, 3);
  const progressPct = bothLoaded ? 100 : filledCount === 0 ? 8 : filledCount === 1 ? 50 : 78;

  return (
    <div className="animate-compare-pop rounded-sm border border-border/80 bg-card/80 px-4 py-3.5 backdrop-blur-sm shadow-product sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Your progress
        </p>
        <p className="text-[11px] font-semibold text-primary">
          {bothLoaded
            ? "Comparison ready"
            : filledCount === 0
              ? "Start with product A"
              : filledCount === 1
                ? "Add one more product"
                : "Loading details…"}
        </p>
      </div>

      <div className="relative mb-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const done =
            (step.id === 1 && filledCount >= 1) ||
            (step.id === 2 && filledCount >= 2) ||
            (step.id === 3 && bothLoaded);
          const current = !done && step.id === activeStep;

          return (
            <li key={step.id} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "mb-1.5 flex h-8 w-8 items-center justify-center rounded-sm text-xs font-bold transition-all duration-300",
                  done
                    ? "bg-success text-success-foreground"
                    : current
                      ? "bg-primary text-primary-foreground shadow-product animate-vs-pulse"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "font-heading text-[11px] font-bold sm:text-xs",
                  done || current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
