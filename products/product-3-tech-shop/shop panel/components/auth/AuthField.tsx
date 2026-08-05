"use client";

import { AppInput, type AppInputProps } from "@/components/shared/AppInput";

type AuthFieldProps = AppInputProps & {
  /** @deprecated use errorMessage */
  error?: string;
};

/**
 * Auth-form field — thin alias over AppInput for auth screens.
 */
export function AuthField({ error, errorMessage, ...props }: AuthFieldProps) {
  return (
    <AppInput
      {...props}
      errorMessage={errorMessage ?? error}
      labelClassName={props.labelClassName ?? "text-sm font-medium mb-1 block"}
    />
  );
}

/** @deprecated Prefer AppInput className / inputSize */
export const authInputClassName =
  "w-full px-3 py-2.5 rounded-sm border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
