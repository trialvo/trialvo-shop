"use client";

import { useMemo, type ReactElement } from "react";
import { AppSelect } from "@/components/shared/AppSelect";
import type { AddressItem } from "@/lib/api/address/service";
import type { AppSelectOption } from "@/lib/ui/appSelect";
import { cn } from "@/lib/utils";

type CheckoutSavedAddressSelectProps = Readonly<{
  addresses: AddressItem[];
  loading?: boolean;
  value: string;
  onChange: (addressId: string, address: AddressItem | null) => void;
  className?: string;
}>;

/**
 * Compact saved-address picker for authenticated checkout.
 */
export function CheckoutSavedAddressSelect({
  addresses,
  loading = false,
  value,
  onChange,
  className,
}: CheckoutSavedAddressSelectProps): ReactElement | null {
  const options = useMemo<AppSelectOption[]>(() => {
    return [
      { value: "__new__", label: "Use a new address" },
      ...addresses.map((addr) => ({
        value: String(addr.id),
        label: `${addr.is_default ? "★ " : ""}${addr.name} — ${addr.full_address}${
          addr.city ? `, ${addr.city}` : ""
        }`,
      })),
    ];
  }, [addresses]);

  if (!loading && addresses.length === 0) return null;

  return (
    <div className={cn("sm:col-span-2", className)} data-checkout-error="addressId">
      <AppSelect
        label="Saved address"
        labelClassName="text-xs font-medium mb-1 block"
        value={value ? value : "__new__"}
        options={options}
        disabled={loading}
        searchable={addresses.length > 6}
        layer="page"
        placeholder={loading ? "Loading addresses…" : "Use a new address"}
        emptyLabel="No saved addresses"
        onChange={(nextId) => {
          if (!nextId || nextId === "__new__") {
            onChange("", null);
            return;
          }
          const found = addresses.find((a) => String(a.id) === nextId) ?? null;
          onChange(nextId, found);
        }}
        triggerClassName="h-9 rounded-sm border-border bg-secondary/50 text-xs cursor-pointer"
        hint={loading ? "Loading addresses…" : undefined}
      />
    </div>
  );
}

export default CheckoutSavedAddressSelect;
