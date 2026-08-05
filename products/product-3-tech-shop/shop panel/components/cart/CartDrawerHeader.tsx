"use client";

import { useState, type ReactElement } from "react";
import { Trash2 } from "lucide-react";
import { CartClearConfirmDialog } from "@/components/cart/CartClearConfirmDialog";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";

type CartDrawerHeaderProps = Readonly<{
  totalItems: number;
  hasItems: boolean;
}>;

export function CartDrawerHeader({
  totalItems,
  hasItems,
}: CartDrawerHeaderProps): ReactElement {
  const { clearCart } = useCart();
  const [clearOpen, setClearOpen] = useState(false);

  return (
    <>
      <SheetHeader className="shrink-0 space-y-0 border-b border-border px-4 py-3.5 pr-12 text-left">
        <div className="flex items-center justify-between gap-3">
          <SheetTitle className="font-heading flex items-baseline gap-2 text-left text-base">
            Shopping cart
            {hasItems ? (
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            ) : null}
          </SheetTitle>

          {hasItems ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
              onClick={() => setClearOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Clear all
            </button>
          ) : null}
        </div>
      </SheetHeader>

      <CartClearConfirmDialog
        open={clearOpen}
        itemCount={totalItems}
        onOpenChange={setClearOpen}
        onConfirm={() => {
          clearCart();
          setClearOpen(false);
        }}
      />
    </>
  );
}
