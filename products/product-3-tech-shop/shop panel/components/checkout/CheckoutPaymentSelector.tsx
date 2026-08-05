"use client";

import { useEffect, useMemo } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { CheckoutOptionCard } from "@/components/checkout/CheckoutOptionCard";
import { usePaymentProviders } from "@/hooks/usePaymentProviders";
import {
  isCodPaymentProvider,
  isGatewayPaymentMethod,
  paymentMethodDisplayLabel,
} from "@/lib/checkout/paymentMethod";
import { cn } from "@/lib/utils";

type CheckoutPaymentSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/**
 * Graduate PaymentMethod — providers from /user/payment-provider,
 * RadioGroup 2/3-col, black selected border.
 */
export function CheckoutPaymentSelector({
  value,
  onChange,
  error,
}: CheckoutPaymentSelectorProps) {
  const { providers, providersLoading, defaultProvider } = usePaymentProviders({
    is_active: true,
  });

  const options = useMemo(() => {
    const active = providers.filter((p) => p.is_active);
    const fromApi = active
      .filter((p) => {
        const key = p.provider.trim().toLowerCase();
        return key === "cod" || isGatewayPaymentMethod(key);
      })
      .map((p) => {
        const key = p.provider.trim().toLowerCase();
        return {
          key,
          label: paymentMethodDisplayLabel(key, p.gateway_name),
        };
      });

    if (fromApi.length > 0) return fromApi;

    const onlineKey =
      defaultProvider && isGatewayPaymentMethod(defaultProvider)
        ? defaultProvider.trim().toLowerCase()
        : "sslcommerz";

    return [
      { key: "cod", label: "Cash on Delivery" },
      { key: onlineKey, label: "Online Payment" },
    ];
  }, [defaultProvider, providers]);

  useEffect(() => {
    if (providersLoading) return;
    if (value && options.some((o) => o.key === value)) return;
    const cod = options.find((o) => isCodPaymentProvider(o.key)) ?? options[0];
    if (cod) onChange(cod.key);
  }, [onChange, options, providersLoading, value]);

  const total = options.length;

  return (
    <section className="space-y-3" data-checkout-error="paymentProvider">
      <h2 className="text-base font-semibold text-black">Payment Method</h2>
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(String(v))}
        className={cn("grid gap-3", "grid-cols-2", "min-[501px]:grid-cols-3")}
      >
        {(providersLoading ? [] : options).map((opt, idx) => {
          const isLast = idx === total - 1;
          const isOddCount = total % 2 === 1;
          return (
            <div
              key={opt.key}
              className={cn(
                isLast && isOddCount && "max-[500px]:col-span-2",
              )}
            >
              <CheckoutOptionCard
                id={opt.key}
                label={opt.label}
                checked={value === opt.key}
              />
            </div>
          );
        })}
      </RadioGroup>
    </section>
  );
}
