"use client";

import { useMemo, useState, type ReactElement } from "react";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import { AddressEmpty } from "@/components/account/addresses/AddressEmpty";
import { AddressFormDialog } from "@/components/account/addresses/AddressFormDialog";
import { AddressList } from "@/components/account/addresses/AddressList";
import { AddressListSkeleton } from "@/components/account/addresses/AddressListSkeleton";
import {
  AddressPhoneOtpDialog,
  type AddressPhoneOtpDialogState,
} from "@/components/account/addresses/AddressPhoneOtpDialog";
import { useAddress } from "@/hooks/useAddress";
import { usePhone } from "@/hooks/usePhone";
import {
  assertValidAddressId,
  assertValidPhoneId,
  emptyAddressFormValues,
  toAddressFormValues,
  toAddressMutationPayload,
  toUpdateAddressPayload,
  type AccountAddressFormValues,
} from "@/lib/adapters/accountAddress";
import { getUnknownErrorMessage } from "@/lib/api/errors";

type FormMode = "closed" | "create" | "edit";

/**
 * Account → Addresses tab.
 * List + modal create/edit; delete / set-default / phone verify via API.
 */
export function AddressesTab(): ReactElement {
  const {
    addresses,
    addressesLoading,
    addressesError,
    refetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddress();
  const { sendPhoneOtp } = usePhone();

  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [otpDialog, setOtpDialog] =
    useState<AddressPhoneOtpDialogState | null>(null);

  const editingAddress = useMemo(
    () =>
      editingId ? (addresses.find((a) => a.id === editingId) ?? null) : null,
    [addresses, editingId],
  );

  const formInitial = useMemo(
    () =>
      editingAddress
        ? toAddressFormValues(editingAddress)
        : emptyAddressFormValues(),
    [editingAddress],
  );

  const busyId =
    deleteAddress.isPending || setDefaultAddress.isPending
      ? (deleteAddress.variables ?? setDefaultAddress.variables ?? null)
      : null;

  const openCreate = () => {
    setEditingId(null);
    setFormMode("create");
  };

  const openEdit = (id: number) => {
    try {
      setEditingId(assertValidAddressId(id));
      setFormMode("edit");
    } catch {
      toast.error("Invalid address.");
    }
  };

  const closeForm = () => {
    setFormMode("closed");
    setEditingId(null);
  };

  const handleVerifyPhone = async (phoneId: number, phoneLabel: string) => {
    try {
      const id = assertValidPhoneId(phoneId);
      await sendPhoneOtp.mutateAsync({ phoneId: id });
      toast.success("OTP sent to your phone");
      setOtpDialog({
        open: true,
        phoneId: id,
        phoneLabel,
      });
    } catch (err) {
      toast.error(getUnknownErrorMessage(err, "Failed to send OTP"));
    }
  };

  const handleSubmit = async (values: AccountAddressFormValues) => {
    try {
      if (formMode === "edit" && editingId) {
        const id = assertValidAddressId(editingId);
        await updateAddress.mutateAsync({
          id,
          payload: toUpdateAddressPayload(values),
        });
        toast.success("Address updated");
      } else {
        await createAddress.mutateAsync(toAddressMutationPayload(values));
        toast.success("Address added!");
      }
      closeForm();
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(
          err,
          formMode === "edit"
            ? "Failed to update address"
            : "Failed to add address",
        ),
      );
    }
  };

  const isSubmitting = createAddress.isPending || updateAddress.isPending;
  const dialogOpen = formMode !== "closed";

  return (
    <div className="bg-card rounded-sm border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Saved Addresses</h2>
          {!addressesLoading && addresses.length > 0 ? (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {addresses.length} saved
              {addresses.some((a) => a.is_default) ? " · one default" : ""}
            </p>
          ) : null}
        </div>
        {!addressesLoading && addresses.length > 0 ? (
          <AppButton
            variant="outline"
            className="text-sm cursor-pointer"
            onClick={openCreate}
          >
            Add Address
          </AppButton>
        ) : null}
      </div>

      {addressesError ? (
        <div className="text-center py-8 space-y-3" role="alert">
          <p className="text-sm text-destructive">
            Failed to load addresses: {addressesError.message}
          </p>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => void refetchAddresses()}
          >
            Try again
          </AppButton>
        </div>
      ) : addressesLoading ? (
        <AddressListSkeleton />
      ) : addresses.length === 0 ? (
        <AddressEmpty onAdd={openCreate} />
      ) : (
        <AddressList
          addresses={addresses}
          onEdit={openEdit}
          onVerifyPhone={(phoneId, phoneLabel) => {
            void handleVerifyPhone(phoneId, phoneLabel);
          }}
          verifyingPhoneId={
            sendPhoneOtp.isPending && typeof sendPhoneOtp.variables?.phoneId === "number"
              ? sendPhoneOtp.variables.phoneId
              : null
          }
          busyId={typeof busyId === "number" ? busyId : null}
        />
      )}

      <AddressFormDialog
        open={dialogOpen}
        mode={formMode === "edit" ? "edit" : "create"}
        initialValues={formMode === "edit" ? formInitial : undefined}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        onSubmit={handleSubmit}
      />

      <AddressPhoneOtpDialog
        state={otpDialog}
        onOpenChange={(open) => {
          if (!open) setOtpDialog(null);
        }}
        onVerified={() => {
          void refetchAddresses();
        }}
      />
    </div>
  );
}

export default AddressesTab;
