"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeInputValue, type InputSanitizeMode } from "@/lib/security/input";
import { cn } from "@/lib/utils";

export type AppTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> & {
  label?: string;
  hint?: string;
  errorMessage?: string;
  containerClassName?: string;
  labelClassName?: string;
  required?: boolean;
  sanitize?: InputSanitizeMode | false;
  maxLength?: number;
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

/**
 * App-wide textarea — mirrors AppInput (label, error, sanitize).
 */
export const AppTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AppTextareaProps
>(
  (
    {
      label,
      hint,
      errorMessage,
      containerClassName,
      labelClassName,
      className,
      id,
      name,
      required = false,
      sanitize = "text",
      maxLength = 2000,
      value,
      onValueChange,
      onChange,
      ...props
    },
    ref,
  ) => {
    const inputId = id || name;
    const hasError = Boolean(errorMessage);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next =
        sanitize === false
          ? e.target.value.slice(0, maxLength)
          : sanitizeInputValue(e.target.value, sanitize, maxLength);
      onValueChange?.(next);
      onChange?.(e);
    };

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className={cn(
              "mb-1 block text-sm font-medium text-foreground",
              labelClassName,
            )}
          >
            {label}
            {required ? (
              <span className="text-destructive" aria-hidden>
                {" "}
                *
              </span>
            ) : null}
          </label>
        ) : null}

        <Textarea
          ref={ref}
          id={inputId}
          name={name}
          value={value}
          maxLength={maxLength}
          aria-invalid={hasError || undefined}
          onChange={handleChange}
          className={cn(
            "min-h-[112px] rounded-sm border-border bg-secondary/50 px-3 py-2.5 text-sm shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
            hasError &&
              "border-destructive focus-visible:ring-destructive/30",
            className,
          )}
          {...props}
        />

        {hint && !hasError ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-1 text-[11px] text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
AppTextarea.displayName = "AppTextarea";

export default AppTextarea;
