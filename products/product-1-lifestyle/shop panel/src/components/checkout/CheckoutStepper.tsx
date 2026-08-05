import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = "customize" | "shipping" | "payment";

const STEP_LABELS: Record<CheckoutStep, string> = {
  customize: "Build Order",
  shipping: "Addresses",
  payment: "Payment",
};

interface CheckoutStepperProps {
  steps: CheckoutStep[];
  currentStep: CheckoutStep;
}

/**
 * Numbered step indicator for the checkout flow.
 * Renders active/done/upcoming states with chevron separators.
 */
export function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
  const currentIdx = steps.indexOf(currentStep as CheckoutStep);

  return (
    <div className="flex items-center gap-2 sm:gap-4 mb-8 sm:mb-10 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const isActive = step === currentStep;
        const isDone = i < currentIdx;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : isDone
                  ? "bg-accent/20 text-accent"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "text-xs tracking-widest uppercase font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {STEP_LABELS[step]}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-muted-foreground ml-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
