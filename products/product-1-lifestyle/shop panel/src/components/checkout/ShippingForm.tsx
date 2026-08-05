"use client";

import { FormField } from "@/components/ui/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { ShippingFormData } from "@/lib/validation/checkout";
import type { Address } from "@/types";
import { MapPin, Check } from "lucide-react";
import { useState } from "react";

interface ShippingFormProps {
  form: UseFormReturn<ShippingFormData>;
  savedAddresses?: Address[];
  onFillFromAddress: (addr: Address) => void;
}

/**
 * RHF-connected shipping address form with saved-address autofill.
 * Extracted from checkout/page.tsx shipping step.
 */
export function ShippingForm({ form, savedAddresses, onFillFromAddress }: ShippingFormProps) {
  const { register, formState: { errors } } = form;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const shippingAddresses = savedAddresses?.filter(
    (addr) => addr.usage === "shipping" || addr.usage === "both",
  );

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    onFillFromAddress(addr);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">
        Shipping Address
      </h2>

      {shippingAddresses && shippingAddresses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Saved Addresses
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shippingAddresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSelectAddress(addr)}
                  className={`
                    group relative w-full text-left p-4 rounded-xl
                    transition-all duration-200 ease-out cursor-pointer
                    ${isSelected
                      ? "bg-accent/5 border-2 border-accent shadow-sm shadow-accent/10"
                      : "bg-secondary/30 border-2 border-transparent hover:bg-secondary/60 hover:border-accent/20"
                    }
                  `}
                >
                  {/* Selected indicator */}
                  <div className={`
                    absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${isSelected
                      ? "bg-accent text-white scale-100"
                      : "bg-border/50 scale-90 group-hover:scale-100 group-hover:bg-border"
                    }
                  `}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>

                  {/* Label & default badge */}
                  <div className="flex items-center gap-2 mb-1.5 pr-6">
                    <span className="font-semibold text-sm text-foreground">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Full name */}
                  <p className="text-sm text-foreground/80 mb-0.5">{addr.fullName}</p>

                  {/* Address details */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {addr.street}
                    {addr.city && <>, {addr.city}</>}
                    {addr.state && <>, {addr.state}</>}
                    {addr.zip && <> {addr.zip}</>}
                  </p>

                  {/* Phone */}
                  {addr.phone && (
                    <p className="text-xs text-muted-foreground/70 mt-1">📞 {addr.phone}</p>
                  )}

                  {/* Click hint */}
                  {!isSelected && (
                    <p className="text-[10px] text-muted-foreground/50 mt-2 group-hover:text-accent/60 transition-colors">
                      Click to use this address
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name *" error={errors.firstName?.message} autoComplete="given-name" {...register("firstName")} />
        <FormField label="Last Name *" error={errors.lastName?.message} autoComplete="family-name" {...register("lastName")} />
      </div>
      <FormField label="Email Address *" type="email" error={errors.email?.message} autoComplete="email" {...register("email")} />
      <FormField label="Phone Number" type="tel" error={errors.phone?.message} autoComplete="tel" {...register("phone")} />
      <FormField label="Street Address *" error={errors.address?.message} autoComplete="street-address" {...register("address")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City *" error={errors.city?.message} autoComplete="address-level2" {...register("city")} />
        <FormField label="State / Region" error={errors.state?.message} autoComplete="address-level1" {...register("state")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ZIP / Postal Code *" error={errors.zip?.message} autoComplete="postal-code" {...register("zip")} />
        <FormField label="Country" error={errors.country?.message} autoComplete="country-name" {...register("country")} />
      </div>
    </div>
  );
}
