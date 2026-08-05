"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Heart } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";

/**
 * Empty wishlist — clear next step to browse shop.
 */
export function WishlistEmpty(): ReactElement {
  return (
    <div className="bg-card rounded-sm border border-border px-5 py-14 text-center">
      <Heart
        className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40"
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground">Your wishlist is empty</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
        Save products you like and come back anytime to buy them.
      </p>
      <AppButton asChild variant="outline" className="mt-4 text-sm">
        <Link href="/shop">Browse products</Link>
      </AppButton>
    </div>
  );
}
