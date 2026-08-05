"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { ModalShell } from "@/components/shared/ModalShell";
import { FormField } from "@/components/ui/FormField";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { addressSchema, type AddressFormData } from "@/lib/validation/profile";
import type { Address, AddressUsage } from "@/types";

type AddressModalProps = {
  isOpen: boolean;
  address: Address | null;
  saving?: boolean;
  onClose: () => void;
  onAdd: (address: Omit<Address, "id">) => void | Promise<void>;
  onEdit: (address: Address) => void | Promise<void>;
};

const defaultValues: AddressFormData = {
  label: "",
  usage: "both",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "United Arab Emirates",
  isDefault: false,
};

const usageOptions: { value: AddressUsage; label: string }[] = [
  { value: "shipping", label: "Shipping" },
  { value: "billing", label: "Billing" },
  { value: "both", label: "Both" },
];

export function AddressModal({
  isOpen,
  address,
  saving = false,
  onClose,
  onAdd,
  onEdit,
}: AddressModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (address) {
      reset({
        label: address.label,
        usage: address.usage,
        fullName: address.fullName,
        phone: address.phone ?? "",
        street: address.street,
        city: address.city,
        state: address.state ?? "",
        zip: address.zip,
        country: address.country,
        isDefault: address.isDefault,
      });
      return;
    }

    reset(defaultValues);
  }, [address, isOpen, reset]);

  const onValid = async (data: AddressFormData) => {
    const normalized = {
      label: getUsageLabel(data.usage),
      usage: data.usage,
      fullName: data.fullName,
      phone: data.phone ?? "",
      street: data.street,
      city: data.city,
      state: data.state ?? "",
      zip: data.zip,
      country: data.country,
      isDefault: data.isDefault ?? false,
    };

    try {
      if (address) {
        await onEdit({ ...normalized, id: address.id });
      } else {
        await onAdd(normalized);
      }
      onClose();
    } catch {
      // Caller owns user-facing error handling.
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={address ? "Edit address" : "New address"}
      panelClassName="relative bg-card border border-border rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
      closeButtonClassName="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hover:rotate-90 active:scale-90 cursor-pointer"
    >
      <form
        onSubmit={handleSubmit(onValid)}
        noValidate
        className="mt-6 border border-border p-5 space-y-4 bg-secondary/30 animate-in fade-in slide-in-from-top-2 duration-200 rounded"
      >
        <h3 className="text-xs font-medium tracking-[0.1em] uppercase text-foreground">
          {address ? "Edit Address" : "New Address"}
        </h3>

        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.1em] uppercase text-foreground">
            Use For *
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {usageOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer border border-border bg-card px-3 py-2 rounded text-xs text-muted-foreground hover:border-accent/30 transition-colors"
              >
                <input
                  type="radio"
                  value={option.value}
                  className="accent-accent cursor-pointer"
                  {...register("usage")}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {errors.usage?.message && (
            <p className="text-xs text-destructive">{errors.usage.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Full Name *"
            error={errors.fullName?.message}
            autoComplete="name"
            {...register("fullName")}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Phone"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.phone?.message}
                name={field.name}
                id="address-phone"
                defaultCountryCode="AE"
              />
            )}
          />
        </div>

        <FormField
          label="Country"
          error={errors.country?.message}
          autoComplete="country-name"
          {...register("country")}
        />

        <FormField
          label="Street Address *"
          error={errors.street?.message}
          autoComplete="street-address"
          {...register("street")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="City *"
            error={errors.city?.message}
            autoComplete="address-level2"
            {...register("city")}
          />
          <FormField
            label="State"
            error={errors.state?.message}
            autoComplete="address-level1"
            {...register("state")}
          />
          <FormField
            label="ZIP *"
            error={errors.zip?.message}
            autoComplete="postal-code"
            {...register("zip")}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="accent-accent cursor-pointer"
            {...register("isDefault")}
          />
          <span className="text-xs text-muted-foreground">Set as default address</span>
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 border border-border text-xs tracking-[0.15em] uppercase font-medium text-foreground hover:bg-secondary transition-colors rounded cursor-pointer disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-accent hover:text-accent-foreground transition-colors rounded flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Address
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function getUsageLabel(usage: AddressUsage): string {
  if (usage === "shipping") return "Shipping";
  if (usage === "billing") return "Billing";
  return "Shipping & Billing";
}
