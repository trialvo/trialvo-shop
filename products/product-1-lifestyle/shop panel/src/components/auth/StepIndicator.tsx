import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  /** Total number of steps to render. */
  totalSteps: number;
  /** Zero-based index of the current active step. */
  currentStep: number;
}

/**
 * A row of pill-shaped dots that communicate multi-step form progress.
 * Completed steps become wider accent pills; the active step is filled foreground.
 */
export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <span
          key={i}
          aria-current={i === currentStep ? "step" : undefined}
          className={cn(
            "inline-block h-1.5 rounded-full transition-all duration-500",
            i < currentStep
              ? "bg-accent w-4"                   // completed
              : i === currentStep
                ? "bg-foreground w-1.5"            // active
                : "bg-border w-1.5",               // upcoming
          )}
        />
      ))}
    </div>
  );
}
