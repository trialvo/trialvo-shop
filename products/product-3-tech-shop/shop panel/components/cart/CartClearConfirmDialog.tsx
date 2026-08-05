"use client";

import type { ReactElement } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CartClearConfirmDialogProps = Readonly<{
  open: boolean;
  itemCount: number;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}>;

/**
 * Mandatory confirmation before clearing every cart line.
 */
export function CartClearConfirmDialog({
  open,
  itemCount,
  busy = false,
  onOpenChange,
  onConfirm,
}: CartClearConfirmDialogProps): ReactElement {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="rounded-sm w-[calc(100%-1.5rem)] max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Clear entire cart?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {itemCount}{" "}
            {itemCount === 1 ? "item" : "items"} from your cart. You can add
            products again anytime from the shop.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-sm cursor-pointer"
            disabled={busy}
          >
            Keep items
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-sm cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            Clear cart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
