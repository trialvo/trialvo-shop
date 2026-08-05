"use client";

import { MapPin, Phone, Mail, User } from "lucide-react";
import type { CheckoutDeliveryAddress } from "@/types/checkout-result";

interface DeliveryAddressCardProps {
  address: CheckoutDeliveryAddress;
}

const FIELDS = [
  { key: "name" as const, icon: User, label: "Name" },
  { key: "address" as const, icon: MapPin, label: "Address" },
  { key: "mobile" as const, icon: Phone, label: "Mobile" },
  { key: "email" as const, icon: Mail, label: "Email" },
] as const;

/**
 * Delivery address card used on the success page.
 * Grid layout with icon chips matching the theme.
 */
export function DeliveryAddressCard({ address }: DeliveryAddressCardProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
        Delivery Address
      </h3>

      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
        {FIELDS.map(({ key, icon: Icon, label }) => (
          <div key={key} className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={13} strokeWidth={1.75} className="text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] text-muted-foreground/60 uppercase tracking-wider leading-tight">
                {label}
              </p>
              <p className="text-[13px] text-foreground leading-snug mt-0.5">
                {address[key] || "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
