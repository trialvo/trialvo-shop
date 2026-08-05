"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import { usePaymentProvider } from "@/hooks/usePaymentProviders";
import { cn } from "@/lib/utils";
import React from "react";
import PaymentCard from "./PaymentCard";

type Props = {
  value?: string;
  onChange?: React.Dispatch<React.SetStateAction<string>>;
};

const COD_PROVIDER_KEY = "cod";

const PaymentMethod: React.FC<Props> = ({ value, onChange }) => {
  const { data, providersLoading } = usePaymentProvider({ is_active: true });

  const providers = data?.providers ?? [];
  const defaultProvider = (data?.default_provider ?? "").trim();

  const [innerValue, setInnerValue] = React.useState<string>("");

  const hasExternalValue = typeof value === "string" && value.trim().length > 0;

  React.useEffect(() => {
    if (hasExternalValue) return;

    if (innerValue) return;

    const codProvider = providers.find((p) => String(p?.provider).toLowerCase() === COD_PROVIDER_KEY);
    if (codProvider?.provider) {
      const codValue = String(codProvider.provider);
      setInnerValue(codValue);
      if (onChange) {
        onChange(codValue);
      }
      return;
    }

    if (defaultProvider) {
      setInnerValue(defaultProvider);
      return;
    }

    const first = providers[0]?.provider;
    if (first) setInnerValue(String(first));
  }, [hasExternalValue, innerValue, providers, defaultProvider]);

  const controlledValue = hasExternalValue ? (value as string).trim() : innerValue;
  const setControlledValue = onChange ?? setInnerValue;

  const total = providers.length;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Payment Method</h2>

      <RadioGroup
        value={controlledValue}
        onValueChange={(v) => setControlledValue(String(v))}
        className={cn("grid gap-3", "grid-cols-2", "min-[501px]:grid-cols-3")}
      >
        {(providersLoading ? [] : providers).map((method, idx) => {
          const providerId = String(method.provider);
          const isLast = idx === total - 1;
          const isOddCount = total % 2 === 1;

          return (
            <div key={providerId} className={cn(isLast && isOddCount && "max-[500px]:col-span-2")}>
              <PaymentCard
                id={providerId}
                label={method.gateway_name}
                checked={controlledValue === providerId}
              />
            </div>
          );
        })}
      </RadioGroup>
    </section>
  );
};

export default PaymentMethod;
