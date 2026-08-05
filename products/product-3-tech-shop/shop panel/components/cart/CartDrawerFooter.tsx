"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { AppButton } from "@/components/shared/AppButton";

type CartDrawerFooterProps = Readonly<{
  totalPrice: number;
  checkoutBusy: boolean;
  onViewCart: () => void;
  onCheckout: () => void;
}>;

export function CartDrawerFooter({
  totalPrice,
  checkoutBusy,
  onViewCart,
  onCheckout,
}: CartDrawerFooterProps): ReactElement {
  return (
    <div className="shrink-0 space-y-3 border-t border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Subtotal</p>
          <p className="text-[11px] text-muted-foreground">
            Shipping & discounts at checkout
          </p>
        </div>
        <p className="font-heading text-xl font-bold text-primary tabular-nums">
          ৳{totalPrice.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <AppButton
          fullWidth
          variant="accent"
          size="lg"
          className="font-semibold cursor-pointer rounded-sm"
          isLoading={checkoutBusy}
          loadingText="Preparing…"
          onClick={onCheckout}
        >
          Checkout
        </AppButton>
        <AppButton
          fullWidth
          variant="outline"
          size="lg"
          asChild
          className="cursor-pointer rounded-sm"
          onClick={onViewCart}
        >
          <Link href="/cart">View cart</Link>
        </AppButton>
      </div>
    </div>
  );
}
