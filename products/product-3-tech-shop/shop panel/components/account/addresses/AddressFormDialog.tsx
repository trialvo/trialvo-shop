"use client";

import type { ReactElement } from "react";
import { MapPinned } from "lucide-react";
import { AddressForm } from "@/components/account/addresses/AddressForm";
import { AppButton } from "@/components/shared/AppButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  emptyAddressFormValues,
  type AccountAddressFormValues,
} from "@/lib/adapters/accountAddress";
import { cn } from "@/lib/utils";

type AddressFormDialogProps = Readonly<{
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AccountAddressFormValues;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AccountAddressFormValues) => Promise<void>;
}>;

const FORM_ID = "account-address-dialog-form";

/**
 * Wider responsive address modal — full-bleed sheet on mobile, xl card on desktop.
 */
export function AddressFormDialog({
  open,
  mode,
  initialValues,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: AddressFormDialogProps): ReactElement {
  const isEdit = mode === "edit";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSubmitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        motion="bottom-sheet"
        className={cn(
          "gap-0 overflow-hidden border-border bg-card p-0 shadow-xl flex flex-col",
          // Mobile: near full-screen sheet height
          "w-full h-[min(96dvh,100%)] max-h-[96dvh]",
          // Desktop / tablet: wider centered panel
          "sm:h-auto sm:max-h-[min(90vh,820px)]",
          "sm:w-[min(92vw,42rem)] sm:max-w-2xl",
          "md:w-[min(90vw,48rem)] md:max-w-3xl",
          "sm:rounded-sm",
        )}
        onPointerDownOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <div
          className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0"
          aria-hidden
        >
          <span className="h-1 w-11 rounded-full bg-border" />
        </div>

        <DialogHeader className="relative shrink-0 px-4 pt-2 pb-3.5 sm:px-6 sm:pt-5 sm:pb-4 border-b border-border text-left space-y-0">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent"
            aria-hidden
          />
          <div className="relative flex items-start gap-3 pr-9">
            <span
              className={cn(
                "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border",
                "bg-secondary/60 text-primary",
              )}
            >
              <MapPinned className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                {isEdit ? "Edit address" : "Add address"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-[13px] leading-relaxed">
                {isEdit
                  ? "Keep your delivery details up to date for smoother checkout."
                  : "Save a delivery address once — reuse it on every order."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          <AddressForm
            formId={FORM_ID}
            mode={mode}
            initialValues={
              isEdit ? initialValues : emptyAddressFormValues()
            }
            isSubmitting={isSubmitting}
            showActions={false}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>

        <DialogFooter
          className={cn(
            "shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-border gap-2",
            "bg-secondary/25 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "flex-col-reverse sm:flex-row sm:justify-end",
          )}
        >
          <AppButton
            type="button"
            variant="outline"
            className="cursor-pointer w-full sm:w-auto sm:min-w-[7rem]"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            form={FORM_ID}
            className="cursor-pointer w-full sm:w-auto sm:min-w-[9rem]"
            isLoading={isSubmitting}
            loadingText={isEdit ? "Updating…" : "Saving…"}
          >
            {isEdit ? "Update address" : "Save address"}
          </AppButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
