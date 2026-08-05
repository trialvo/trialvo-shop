"use client";

import type { MouseEvent, ReactElement } from "react";
import { Check, GitCompare, X } from "lucide-react";
import { useCompare, type CompareSlot } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";

type AddToCompareButtonProps = Readonly<{
  product: CompareSlot;
  variant?: "icon" | "full";
  className?: string;
}>;

/**
 * Toggle a product into / out of the 2-slot compare list.
 * Disabled when slots are full and this product is not already selected.
 */
export function AddToCompareButton({
  product,
  variant = "icon",
  className,
}: AddToCompareButtonProps): ReactElement {
  const { addToCompare, removeFromCompare, isInCompare, isFull, isHydrated } =
    useCompare();
  const inCompare = isInCompare(product.id);
  const blocked = isHydrated && !inCompare && isFull;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isHydrated) return;
    if (inCompare) {
      removeFromCompare(product.id);
      return;
    }
    if (blocked) return;
    addToCompare(product);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
        onClick={handleClick}
        disabled={blocked}
        title={
          inCompare
            ? "Remove from compare"
            : blocked
              ? "Compare slots full — remove one first"
              : "Add to compare"
        }
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-sm border transition-all duration-200 cursor-pointer",
          inCompare
            ? "border-primary bg-primary text-primary-foreground"
            : blocked
              ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60"
              : "border-border bg-card/80 text-muted-foreground hover:border-primary hover:text-primary",
          className,
        )}
      >
        {inCompare ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <GitCompare className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={blocked}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
        inCompare
          ? "border-primary bg-primary/5 text-primary hover:bg-primary/10"
          : blocked
            ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
        className,
      )}
    >
      {inCompare ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Added to Compare
          <X className="ml-0.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </>
      ) : (
        <>
          <GitCompare className="h-4 w-4" aria-hidden />
          {blocked ? "Compare Full" : "Add to Compare"}
        </>
      )}
    </button>
  );
}

export default AddToCompareButton;
