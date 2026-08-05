"use client";

import { useEffect, useMemo } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutOptionCard } from "@/components/checkout/CheckoutOptionCard";
import { useDelivery, type DeliveryCharge } from "@/hooks/useDelivery";
import { cn } from "@/lib/utils";

type CheckoutDeliverySelectorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function isSelectable(charge: DeliveryCharge): boolean {
  if (charge.status === undefined || charge.status === null) return true;
  return charge.status === true || Number(charge.status) === 1;
}

/**
 * Graduate DeliverySelector layout — 2/3-col RadioGroup, black border cards.
 */
export function CheckoutDeliverySelector({
  value,
  onChange,
  error,
}: CheckoutDeliverySelectorProps) {
  const { deliveryCharges, deliveryLoading } = useDelivery();
  const active = useMemo(
    () => deliveryCharges.filter(isSelectable),
    [deliveryCharges],
  );

  useEffect(() => {
    if (deliveryLoading || active.length === 0) return;
    const valid = value && active.some((c) => String(c.id) === value);
    if (valid) return;

    const inside = active.find((c) =>
      String(c.type ?? "")
        .toLowerCase()
        .includes("inside"),
    );
    onChange(String((inside ?? active[0]).id));
  }, [active, deliveryLoading, onChange, value]);

  const total = active.length;

  return (
    <section className="space-y-3" data-checkout-error="deliveryChargeId">
      <h2 className="text-base font-semibold text-black">
        Select Delivery Area
      </h2>
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {deliveryLoading ? (
        <div
          className={cn("grid gap-3", "grid-cols-2", "min-[501px]:grid-cols-3")}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(i === 2 ? "max-[500px]:col-span-2" : undefined)}
            >
              <div className="rounded-none border border-[#E9E9E9] bg-white p-4">
                <div className="flex justify-between">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : active.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Delivery options are temporarily unavailable.
        </p>
      ) : (
        <RadioGroup
          value={value}
          onValueChange={(v) => onChange(String(v))}
          className={cn("grid gap-3", "grid-cols-2", "min-[501px]:grid-cols-3")}
        >
          {active.map((charge, idx) => {
            const isLast = idx === total - 1;
            const isOddCount = total % 2 === 1;
            const fee = Number(charge.customer_charge) || 0;
            const id = String(charge.id);
            return (
              <div
                key={id}
                className={cn(
                  isLast && isOddCount && "max-[500px]:col-span-2",
                )}
              >
                <CheckoutOptionCard
                  id={id}
                  tag={charge.title}
                  label={
                    fee === 0 ? "FREE" : `BDT ${fee.toLocaleString()}`
                  }
                  hint={charge.type?.replace(/_/g, " ") || undefined}
                  checked={value === id}
                />
              </div>
            );
          })}
        </RadioGroup>
      )}
    </section>
  );
}
