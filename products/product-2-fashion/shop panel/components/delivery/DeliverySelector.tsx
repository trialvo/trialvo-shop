"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useDelivery } from "@/hooks/useDelivery";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { setDeliveryCharge, setWeightSettings } from "@/redux/slices/cartSlice";
import React from "react";
import type { IconType } from "react-icons";
import { FiBox, FiHome, FiMapPin, FiPackage, FiTruck } from "react-icons/fi";
import DeliveryCard from "./DeliveryCard";

function getDeliveryIcon(type?: string): IconType {
  const t = (type ?? "").toLowerCase();

  if (t.includes("pickup") || t.includes("office")) return FiHome;
  if (t.includes("free")) return FiPackage;
  if (t.includes("inside")) return FiMapPin;
  if (t.includes("outside")) return FiTruck;

  return FiBox;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hideTitle?: boolean;
};

function toChargeNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const DeliverySelector: React.FC<Props> = ({ value, onChange, className, hideTitle = false }) => {
  const { charges, isLoading } = useDelivery();
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (isLoading) return;
    if (!charges?.length) return;

    const isValid = value && charges.some((c) => String(c.id) === value);
    if (isValid) return;

    const inside = charges.find((c) => String(c.type ?? "").toLowerCase() === "inside_of_dhaka");
    if (inside?.id != null) {
      onChange(String(inside.id));
      return;
    }

    onChange(String(charges[1].id));
  }, [charges, isLoading, onChange, value]);

  React.useEffect(() => {
    if (isLoading) return;
    if (!charges?.length) return;
    if (!value) return;

    const selected = charges.find((c) => String(c.id) === value);
    if (!selected) return;

    dispatch(setDeliveryCharge(toChargeNumber(selected.customer_charge)));
    dispatch(setWeightSettings({
      // backend returns default_weight_kg / extra_charge_per_kg (DB column names)
      weightFreeKg:   toChargeNumber(selected.default_weight_kg  ?? selected.weight_free_kg  ?? 0),
      weightExtraPerKg: toChargeNumber(selected.extra_charge_per_kg ?? selected.extra_per_kg ?? 0),
    }));
  }, [charges, dispatch, isLoading, value]);

  if (isLoading) {
    return (
      <section className={cn(hideTitle ? "space-y-0" : "space-y-3", className)}>
        {hideTitle ? null : (
          <h2 className="text-sm font-semibold tracking-tight text-black">Select Delivery Area</h2>
        )}

        <div className={cn("grid gap-2", hideTitle ? "grid-cols-1" : "grid-cols-2 min-[501px]:grid-cols-3")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(i === 2 ? "max-[500px]:col-span-2" : undefined)}>
              <div className="rounded border border-[#E9E9E9] bg-white p-4">
                <div className="flex justify-between">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const total = charges?.length ?? 0;

  return (
    <section className={cn(hideTitle ? "space-y-0" : "space-y-3", className)}>
      {hideTitle ? null : (
        <h2 className="text-sm font-semibold tracking-tight text-black">Select Delivery Area</h2>
      )}

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(String(v))}
        className={cn("grid gap-2", hideTitle ? "grid-cols-1" : "grid-cols-2 min-[501px]:grid-cols-3")}
      >
        {(charges ?? []).map((option, idx) => {
          const isLast = idx === total - 1;
          const isOddCount = total % 2 === 1;

          return (
            <div key={option.id} className={cn(isLast && isOddCount && "max-[500px]:col-span-2")}>
              <DeliveryCard
                id={String(option.id)}
                title={option.title}
                price={`BDT ${option.customer_charge ?? 0}`}
                icon={getDeliveryIcon(option.type)}
                checked={value === String(option.id)}
                src={option?.img_path}
              />
            </div>
          );
        })}
      </RadioGroup>
    </section>
  );
};

export default DeliverySelector;
