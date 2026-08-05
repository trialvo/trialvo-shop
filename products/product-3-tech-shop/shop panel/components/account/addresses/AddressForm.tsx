"use client";

import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { FormAppSelect } from "@/components/shared/FormAppSelect";
import { FormPhoneInput } from "@/components/phone/FormPhoneInput";
import {
  ADDRESS_TYPES,
  BD_DIVISIONS,
  accountAddressFormSchema,
  emptyAddressFormValues,
  getDistrictsForDivision,
  type AccountAddressFormValues,
  type AddressType,
} from "@/lib/adapters/accountAddress";
import type { AppSelectOption } from "@/lib/ui/appSelect";

type AddressFormProps = Readonly<{
  mode: "create" | "edit";
  initialValues?: AccountAddressFormValues;
  isSubmitting?: boolean;
  onSubmit: (values: AccountAddressFormValues) => Promise<void>;
  onCancel: () => void;
  /** When embedded in a dialog footer is handled by parent — form only. */
  showActions?: boolean;
  formId?: string;
}>;

const DIVISION_OPTIONS: AppSelectOption[] = BD_DIVISIONS.map((d) => ({
  value: d,
  label: d,
}));

const TYPE_OPTIONS: AppSelectOption<AddressType>[] = ADDRESS_TYPES.map(
  (t) => ({
    value: t,
    label: t === "n/a" ? "Other" : t[0]!.toUpperCase() + t.slice(1),
  }),
);

/**
 * Address create/edit fields — RHF + zod + AppSelect / FormPhoneInput.
 */
export function AddressForm({
  mode,
  initialValues,
  isSubmitting = false,
  onSubmit,
  onCancel,
  showActions = true,
  formId = "address-form",
}: AddressFormProps): ReactElement {
  const form = useForm<AccountAddressFormValues>({
    resolver: zodResolver(
      accountAddressFormSchema,
    ) as Resolver<AccountAddressFormValues>,
    defaultValues: initialValues ?? emptyAddressFormValues(),
    mode: "onTouched",
  });

  const { control, handleSubmit, reset, setValue, formState } = form;
  const selectedDivision = useWatch({ control, name: "division" });
  const selectedDistrict = useWatch({ control, name: "district" });
  const previousDivisionRef = useRef(selectedDivision);

  useEffect(() => {
    const next = initialValues ?? emptyAddressFormValues();
    reset(next);
    previousDivisionRef.current = next.division;
  }, [initialValues, reset]);

  const districtOptions = useMemo((): AppSelectOption[] => {
    const base = getDistrictsForDivision(selectedDivision).map((d) => ({
      value: d,
      label: d,
    }));

    // Keep legacy free-text district visible while editing until user re-picks.
    if (
      selectedDistrict &&
      !base.some((option) => option.value === selectedDistrict)
    ) {
      return [
        { value: selectedDistrict, label: selectedDistrict },
        ...base,
      ];
    }

    return base;
  }, [selectedDivision, selectedDistrict]);

  useEffect(() => {
    // Only reset district when the user changes division — not on initial edit load.
    if (previousDivisionRef.current === selectedDivision) return;
    previousDivisionRef.current = selectedDivision;

    if (!selectedDivision) {
      setValue("district", "", { shouldValidate: true, shouldDirty: true });
      return;
    }

    const allowed = getDistrictsForDivision(selectedDivision);
    if (selectedDistrict && !allowed.includes(selectedDistrict)) {
      setValue("district", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedDivision, selectedDistrict, setValue]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      noValidate
      className="space-y-3.5 sm:space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        <FormAppInput
          control={control}
          name="name"
          label="Name"
          labelClassName="text-xs font-medium mb-1 block"
          sanitize="text"
          maxLength={80}
          inputSize="sm"
          autoComplete="name"
          required
        />
        <FormPhoneInput
          control={control}
          name="phone"
          label="Phone"
          labelClassName="text-xs font-medium mb-1 block"
          detectCountry
          inputClassName="h-9 text-sm rounded-r-sm"
          triggerClassName="h-9 rounded-l-sm"
          required
        />
      </div>

      <FormAppInput
        control={control}
        name="address"
        label="Address"
        labelClassName="text-xs font-medium mb-1 block"
        sanitize="text"
        maxLength={300}
        inputSize="sm"
        autoComplete="street-address"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        <FormAppSelect
          control={control}
          name="division"
          label="Division"
          labelClassName="text-xs font-medium mb-1 block"
          options={DIVISION_OPTIONS}
          placeholder="Select division"
          searchable
          layer="modal"
          required
        />
        <FormAppSelect
          control={control}
          name="district"
          label="District"
          labelClassName="text-xs font-medium mb-1 block"
          options={districtOptions}
          placeholder={
            selectedDivision ? "Select district" : "Select division first"
          }
          searchable
          layer="modal"
          required
          disabled={!selectedDivision}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        <FormAppSelect<AccountAddressFormValues, AddressType>
          control={control}
          name="type"
          label="Type"
          labelClassName="text-xs font-medium mb-1 block"
          options={TYPE_OPTIONS}
          placeholder="Select type"
          searchable={false}
          layer="modal"
          required
        />
        <FormAppInput
          control={control}
          name="zipCode"
          label="Zip code"
          labelClassName="text-xs font-medium mb-1 block"
          sanitize="text"
          maxLength={20}
          inputSize="sm"
          hint="Optional"
          autoComplete="postal-code"
        />
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <AppButton
            type="submit"
            className="text-sm cursor-pointer"
            isLoading={isSubmitting}
            loadingText={mode === "edit" ? "Updating…" : "Saving…"}
            disabled={isSubmitting || (!formState.isDirty && mode === "edit")}
          >
            {mode === "edit" ? "Update Address" : "Save Address"}
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            className="text-sm cursor-pointer"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </AppButton>
        </div>
      ) : null}
    </form>
  );
}
