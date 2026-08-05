"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { ArrowRight, GitCompare, ShoppingBag, X } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { useCompare } from "@/hooks/useCompare";
import { resolveMediaUrl } from "@/lib/media/url";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom bar when at least one compare slot is filled.
 */
export function CompareFloatingBar(): ReactElement | null {
  const { slots, removeFromCompare, clearCompare, isHydrated } = useCompare();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasAny = slots[0] !== null || slots[1] !== null;
  if (!mounted || !isHydrated || !hasAny) return null;

  const filledSlots = slots.filter(Boolean);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100vw-1rem)] max-w-[760px] -translate-x-1/2 lg:bottom-3",
        "flex flex-wrap items-center gap-2 rounded-sm border border-primary/20 bg-card/95 px-3 py-3 backdrop-blur-md sm:flex-nowrap sm:gap-3 sm:px-4",
        "shadow-product-hover",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          {([0, 1] as const).map((i) => {
            const slot = slots[i];
            const img = slot
              ? resolveMediaUrl(slot.images?.[0]?.path ?? slot.thumbnail)
              : null;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border transition sm:h-12 sm:w-12",
                  slot
                    ? "border-border bg-secondary/40"
                    : "border-dashed border-border bg-secondary/20",
                )}
              >
                {slot ? (
                  <>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={slot.name}
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${slot.name}`}
                      onClick={() => removeFromCompare(slot.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm bg-destructive text-destructive-foreground shadow transition hover:bg-destructive/90"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">
            {filledSlots.length === 2
              ? "2 products to compare"
              : "1 product selected"}
          </p>
          <p className="max-w-[180px] truncate text-[10px] text-muted-foreground sm:max-w-[240px]">
            {filledSlots.map((s) => s!.name).join(" vs ")}
          </p>
        </div>
      </div>

      <div className="ml-auto flex w-full items-center gap-2 sm:w-auto sm:justify-end">
        <AppButton
          asChild
          size="sm"
          className="h-10 flex-1 rounded-sm sm:flex-none"
        >
          <Link href="/compare">
            <GitCompare className="mr-1.5 h-3.5 w-3.5" />
            Compare
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </AppButton>

        <AppButton
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-sm"
          aria-label="Clear compare"
          onClick={clearCompare}
        >
          Clear
        </AppButton>
      </div>
    </div>
  );
}

export default CompareFloatingBar;
