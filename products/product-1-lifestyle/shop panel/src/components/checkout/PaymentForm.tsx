"use client";

import { Lock, ShieldCheck, Banknote, ArrowUpRight } from "lucide-react";
import type { CheckoutPaymentType } from "@/lib/checkout/payment-types";
import {
  PaymentMethodSelector,
  type PaymentMethodOption,
} from "@/components/checkout/PaymentMethodSelector";

interface PaymentFormProps {
  paymentType: CheckoutPaymentType;
  onPaymentTypeChange: (value: CheckoutPaymentType) => void;
  codAvailable: boolean;
  gatewayAvailable: boolean;
  gatewayLabel: string;
}

/**
 * Payment step. Card data is never collected here; gateway payments redirect to
 * the configured provider and COD requires no payment details.
 */
export function PaymentForm({
  paymentType,
  onPaymentTypeChange,
  codAvailable,
  gatewayAvailable,
  gatewayLabel,
}: PaymentFormProps) {
  const paymentOptions: PaymentMethodOption[] = [
    {
      type: "gateway",
      title: "Online Payment",
      description: gatewayAvailable
        ? `Pay securely with ${gatewayLabel}`
        : "Online payment is currently unavailable",
      disabled: !gatewayAvailable,
    },
    {
      type: "cod",
      title: "Cash on Delivery",
      description: codAvailable
        ? "Pay when your order is delivered"
        : "Cash on delivery is currently unavailable",
      disabled: !codAvailable,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">
          Payment Details
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Lock size={12} className="text-success" />
          <span>Secure SSL encrypted payment</span>
        </div>
      </div>

      <PaymentMethodSelector
        value={paymentType}
        options={paymentOptions}
        onChange={onPaymentTypeChange}
      />

      {/* Info card for selected payment */}
      {paymentType === "gateway" ? (
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/15">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <ArrowUpRight size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Redirecting to {gatewayLabel}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                You will be securely redirected to {gatewayLabel} after placing the order. Your card details are handled by the payment provider — we never collect or store them.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck size={12} className="text-success" />
                <span className="text-[11px] font-medium text-success">PCI DSS Compliant</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-success/5 border border-success/15">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
              <Banknote size={16} className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Cash on Delivery</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                No card details are required. Payment will be collected in cash when your order is delivered to your doorstep.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
