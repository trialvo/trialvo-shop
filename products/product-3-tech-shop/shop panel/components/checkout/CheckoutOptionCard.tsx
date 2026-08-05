"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

type CheckoutOptionCardProps = Readonly<{
  id: string;
  label: string;
  checked?: boolean;
  /** Optional second line (e.g. BDT price) */
  hint?: string;
  /** Soft tag above label — graduate DeliveryCard style */
  tag?: string;
}>;

/**
 * Square radio card — gcp_graduatefashion_shop PaymentCard / DeliveryCard.
 */
export function CheckoutOptionCard({
  id,
  label,
  checked,
  hint,
  tag,
}: CheckoutOptionCardProps): ReactElement {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between border p-2 sm:p-4 transition bg-white",
        checked ? "border-black" : "border-gray-400 hover:border-gray-500",
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <RadioGroupItem
          id={id}
          value={id}
          className="mt-1 border-black text-black data-[state=checked]:border-black"
        />
        <div className="min-w-0">
          {tag ? (
            <p className="text-xs w-fit bg-[#D9EFFF] px-1.5 py-0.5 font-normal mb-2">
              {tag}
            </p>
          ) : null}
          <span className="text-sm font-normal text-black block truncate">
            {label}
          </span>
          {hint ? (
            <p className="text-xs text-black font-normal mt-0.5">{hint}</p>
          ) : null}
        </div>
      </div>
    </label>
  );
}
