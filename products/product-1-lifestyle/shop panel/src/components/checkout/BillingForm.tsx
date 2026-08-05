"use client";

import { CreditCard, MapPin, Check } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import type { UseFormReturn } from "react-hook-form";
import type { BillingFormData } from "@/lib/validation/checkout";
import type { Address } from "@/types";
import { useState } from "react";

interface BillingFormProps {
  form: UseFormReturn<BillingFormData>;
  sameAsShipping: boolean;
  onToggleSame: (value: boolean) => void;
  savedAddresses?: Address[];
  onFillFromAddress: (addr: Address) => void;
}

/**
 * Same-as-shipping checkbox + RHF billing address fields.
 * Extracted from the billing section of checkout/page.tsx.
 */
export function BillingForm({ form, sameAsShipping, onToggleSame, savedAddresses, onFillFromAddress }: BillingFormProps) {
  const { register, formState: { errors } } = form;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const billingAddresses = savedAddresses?.filter(
    (addr) => addr.usage === "billing" || addr.usage === "both",
  );

  const handleSelectAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    onFillFromAddress(addr);
  };

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <h2 className="font-display text-xl font-semibold tracking-wide text-foreground flex items-center gap-2">
        <CreditCard size={18} /> Billing Address
      </h2>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={sameAsShipping}
          onChange={(e) => onToggleSame(e.target.checked)}
          className="accent-accent"
        />
        <span className="text-sm text-foreground">Same as shipping address</span>
      </label>

      {!sameAsShipping && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {billingAddresses && billingAddresses.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-accent" />
                <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Use Saved Address
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {billingAddresses.map((addr) => {
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
            <FormField label="First Name" error={errors.billingFirstName?.message} {...register("billingFirstName")} />
            <FormField label="Last Name" error={errors.billingLastName?.message} {...register("billingLastName")} />
          </div>
          <FormField label="Street Address *" error={errors.billingAddress?.message} {...register("billingAddress")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="City *" error={errors.billingCity?.message} {...register("billingCity")} />
            <FormField label="State / Region" error={errors.billingState?.message} {...register("billingState")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="ZIP / Postal Code *" error={errors.billingZip?.message} {...register("billingZip")} />
            <FormField label="Country" error={errors.billingCountry?.message} {...register("billingCountry")} />
          </div>
        </div>
      )}
    </div>
  );
}
