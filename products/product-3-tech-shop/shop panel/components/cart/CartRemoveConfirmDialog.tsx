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

type CartRemoveConfirmDialogProps = Readonly<{
  open: boolean;
  productTitle: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}>;

/**
 * Mandatory confirmation before removing a cart line.
 */
export function CartRemoveConfirmDialog({
  open,
  productTitle,
  busy = false,
  onOpenChange,
  onConfirm,
}: CartRemoveConfirmDialogProps): ReactElement {
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
          <AlertDialogTitle>Remove from cart?</AlertDialogTitle>
          <AlertDialogDescription>
            “{productTitle}” will be removed from your cart. You can add it again
            anytime from the shop.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-sm cursor-pointer" disabled={busy}>
            Keep item
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-sm cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
