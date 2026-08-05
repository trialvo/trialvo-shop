"use client";

import { CreditCard, Globe, Truck, Check, Lock, ShieldCheck } from "lucide-react";
import type { CheckoutPaymentType } from "@/lib/checkout/payment-types";

export type PaymentMethodOption = {
  type: CheckoutPaymentType;
  title: string;
  description: string;
  disabled?: boolean;
};

interface PaymentMethodSelectorProps {
  value: CheckoutPaymentType;
  options: PaymentMethodOption[];
  onChange: (value: CheckoutPaymentType) => void;
}

const PAYMENT_ICONS: Record<CheckoutPaymentType, typeof CreditCard> = {
  gateway: Globe,
  cod: Truck,
};

export function PaymentMethodSelector({
  value,
  options,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
      {options.map((option) => {
        const isActive = option.type === value;
        const Icon = PAYMENT_ICONS[option.type] ?? CreditCard;

        return (
          <button
            key={option.type}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={option.disabled}
            onClick={() => onChange(option.type)}
            className={`
              group relative text-left p-4 rounded-xl
              transition-all duration-200 ease-out cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              ${isActive
                ? "bg-accent/5 border-2 border-accent shadow-sm shadow-accent/10"
                : "bg-secondary/30 border-2 border-transparent hover:bg-secondary/60 hover:border-accent/20"
              }
            `}
          >
            {/* Selected indicator */}
            <div className={`
              absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center
              transition-all duration-200
              ${isActive
                ? "bg-accent text-white scale-100"
                : "bg-border/50 scale-90 group-hover:scale-100 group-hover:bg-border"
              }
            `}>
              {isActive && <Check size={12} strokeWidth={3} />}
            </div>

            {/* Icon */}
            <div className={`
              w-9 h-9 rounded-lg flex items-center justify-center mb-3
              transition-colors duration-200
              ${isActive
                ? "bg-accent/10 text-accent"
                : "bg-secondary text-muted-foreground group-hover:text-foreground"
              }
            `}>
              <Icon size={18} />
            </div>

            {/* Title */}
            <span className="block text-sm font-semibold text-foreground pr-6">{option.title}</span>

            {/* Description */}
            <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
              {option.description}
            </span>

            {/* Security hint for gateway */}
            {option.type === "gateway" && !option.disabled && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <ShieldCheck size={11} className="text-success" />
                <span className="text-[10px] text-success font-medium">Secure & Encrypted</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
