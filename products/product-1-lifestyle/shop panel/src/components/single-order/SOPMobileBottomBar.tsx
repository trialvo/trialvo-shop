"use client";

/**
 * components/single-order/SOPMobileBottomBar.tsx — Sticky mobile checkout bar
 */

interface SOPMobileBottomBarProps {
  itemCount: number;
  total: number;
  onCheckout: () => void;
}

export function SOPMobileBottomBar({
  itemCount,
  total,
  onCheckout,
}: SOPMobileBottomBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="mx-auto flex w-full max-w-[1120px] items-center gap-3 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {itemCount} item{itemCount > 1 ? "s" : ""}
          </p>
          <p className="text-sm font-bold text-foreground">
            BDT{" "}
            {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          className="h-11 flex-1 bg-primary text-primary-foreground text-sm font-bold rounded transition-colors hover:bg-primary/90"
        >
          Checkout →
        </button>
      </div>
    </div>
  );
}
