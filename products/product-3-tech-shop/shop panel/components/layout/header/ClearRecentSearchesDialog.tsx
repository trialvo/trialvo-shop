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

type ClearRecentSearchesDialogProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
}>;

/**
 * Confirmation before wiping local recent-search history.
 */
export function ClearRecentSearchesDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
}: ClearRecentSearchesDialogProps): ReactElement {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-sm sm:rounded-sm max-w-md z-[70]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">
            Clear recent searches?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{" "}
            {count === 1
              ? "1 recent search"
              : `${count} recent searches`}{" "}
            from this device. You can&apos;t undo this action.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-sm">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
          >
            Clear all
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ClearRecentSearchesDialog;
