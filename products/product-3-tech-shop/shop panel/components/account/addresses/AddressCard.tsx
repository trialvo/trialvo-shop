"use client";

import { useState, type ReactElement } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
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
import { AddressPhoneStatus } from "@/components/account/addresses/AddressPhoneStatus";
import { useAddress } from "@/hooks/useAddress";
import {
  assertValidAddressId,
  type AccountAddressViewModel,
} from "@/lib/adapters/accountAddress";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type AddressCardProps = Readonly<{
  address: AccountAddressViewModel;
  onEdit: (id: number) => void;
  onVerifyPhone: (phoneId: number, phoneLabel: string) => void;
  verifyingPhoneId: number | null;
  busyId: number | null;
}>;

type ConfirmKind = "default" | "delete" | null;

/**
 * Stacked address card with default badge and confirm dialogs.
 */
export function AddressCard({
  address,
  onEdit,
  onVerifyPhone,
  verifyingPhoneId,
  busyId,
}: AddressCardProps): ReactElement {
  const { deleteAddress, setDefaultAddress } = useAddress();
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const busy = busyId === address.id;
  const deleting = deleteAddress.isPending && busy;
  const settingDefault = setDefaultAddress.isPending && busy;
  const dialogBusy = deleting || settingDefault;
  const isSendingOtp =
    address.phoneId != null && verifyingPhoneId === address.phoneId;

  const handleDelete = async () => {
    try {
      const id = assertValidAddressId(address.id);
      await deleteAddress.mutateAsync(id);
      toast.success("Address deleted");
      setConfirmKind(null);
    } catch (err) {
      toast.error(getUnknownErrorMessage(err, "Failed to delete address"));
    }
  };

  const handleSetDefault = async () => {
    if (address.isDefault) return;
    try {
      const id = assertValidAddressId(address.id);
      await setDefaultAddress.mutateAsync(id);
      toast.success("Default address updated");
      setConfirmKind(null);
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(err, "Failed to set default address"),
      );
    }
  };

  const requestSetDefault = () => {
    if (address.isDefault || busy) return;
    setConfirmKind("default");
  };

  return (
    <>
      <article
        className={cn(
          "overflow-hidden rounded-sm border border-border bg-card",
          "transition-colors duration-200",
          address.isDefault
            ? "border-primary/35 ring-1 ring-primary/15"
            : "hover:border-border/80",
          busy && "opacity-80",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold font-heading tracking-tight truncate">
                {address.name}
              </h3>
              <span className="shrink-0 rounded-sm border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {address.typeLabel}
              </span>
            </div>
          </div>

          {address.isDefault ? (
            <span className="shrink-0 rounded-sm bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Default
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="space-y-2 border-t border-border/70 px-4 py-3 sm:px-5">
          <p className="text-sm leading-relaxed text-foreground/90 break-words">
            {address.line}
          </p>
          {address.cityLabel ? (
            <p className="text-xs text-muted-foreground">{address.cityLabel}</p>
          ) : null}
          <AddressPhoneStatus
            phoneLabel={address.phoneLabel}
            hasPhone={address.hasPhone}
            isPhoneVerified={address.isPhoneVerified}
            isSendingOtp={isSendingOtp}
            disabled={busy}
            onVerify={() => {
              if (!address.phoneId || !address.phoneLabel) return;
              onVerifyPhone(address.phoneId, address.phoneLabel);
            }}
          />
        </div>

        {/* Action bar */}
        <div
          className={cn(
            "grid border-t border-border/70",
            address.isDefault ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer h-10 rounded-none border-r border-border/70 text-xs font-medium"
            disabled={busy}
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={() => onEdit(address.id)}
          >
            Edit
          </AppButton>
          {!address.isDefault ? (
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer h-10 rounded-none border-r border-border/70 text-xs font-medium"
              disabled={busy || settingDefault}
              leftIcon={<Star className="h-3.5 w-3.5" />}
              onClick={requestSetDefault}
            >
              Default
            </AppButton>
          ) : null}
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            className="cursor-pointer h-10 rounded-none text-xs font-medium text-destructive hover:text-destructive"
            disabled={busy || deleting}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setConfirmKind("delete")}
          >
            Delete
          </AppButton>
        </div>
      </article>

      {/* Set default confirmation */}
      <AlertDialog
        open={confirmKind === "default"}
        onOpenChange={(open) => {
          if (dialogBusy) return;
          if (!open) setConfirmKind(null);
        }}
      >
        <AlertDialogContent className="rounded-sm w-[calc(100%-1.5rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Set as default address?</AlertDialogTitle>
            <AlertDialogDescription>
              “{address.name}” will become your default delivery address for
              checkout. You can change this anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-sm cursor-pointer"
              disabled={settingDefault}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm cursor-pointer"
              disabled={settingDefault}
              onClick={(e) => {
                e.preventDefault();
                void handleSetDefault();
              }}
            >
              {settingDefault ? "Saving…" : "Yes, set default"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmKind === "delete"}
        onOpenChange={(open) => {
          if (dialogBusy) return;
          if (!open) setConfirmKind(null);
        }}
      >
        <AlertDialogContent className="rounded-sm w-[calc(100%-1.5rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this address?</AlertDialogTitle>
            <AlertDialogDescription>
              “{address.name}” will be removed from your saved addresses. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-sm cursor-pointer"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
