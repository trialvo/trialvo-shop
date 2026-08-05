"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { ShoppingBag } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";

type CartDrawerEmptyProps = Readonly<{
  onContinue: () => void;
}>;

export function CartDrawerEmpty({
  onContinue,
}: CartDrawerEmptyProps): ReactElement {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/60">
        <ShoppingBag className="h-9 w-9 text-muted-foreground/50" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <p className="font-heading text-base font-semibold">Your cart is empty</p>
        <p className="text-sm text-muted-foreground max-w-[16rem]">
          Browse the shop and add products you love.
        </p>
      </div>
      <AppButton
        asChild
        className="cursor-pointer rounded-sm"
        onClick={onContinue}
      >
        <Link href="/shop">Continue shopping</Link>
      </AppButton>
    </div>
  );
}
