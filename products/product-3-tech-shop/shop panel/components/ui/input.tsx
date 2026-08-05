import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  defaultMaxLengthForMode,
  inferSanitizeMode,
  sanitizeInputValue,
  type InputSanitizeMode,
} from "@/lib/security/input";

const inputVariants = cva(
  "flex w-full rounded-sm border border-border bg-secondary/50 text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all",
  {
    variants: {
      inputSize: {
        default: "h-10 px-3 py-2.5 text-sm",
        sm: "h-9 px-2.5 py-2 text-xs",
        lg: "h-11 px-4 py-3 text-sm",
        xs: "h-8 px-2 py-1.5 text-xs",
      },
      tone: {
        default: "bg-secondary/50",
        muted: "bg-secondary/30",
        solid: "bg-card",
        ghost: "bg-transparent border-transparent focus-visible:border-border",
      },
    },
    defaultVariants: {
      inputSize: "default",
      tone: "default",
    },
  },
);

export type InputProps = Omit<
  React.ComponentProps<"input">,
  "size" | "onChange"
> &
  VariantProps<typeof inputVariants> & {
    /** Sanitization strategy applied on every change */
    sanitize?: InputSanitizeMode | false;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onValueChange?: (value: string) => void;
    error?: boolean;
  };

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      inputSize,
      tone,
      sanitize,
      maxLength,
      onChange,
      onValueChange,
      error,
      autoComplete,
      spellCheck,
      ...props
    },
    ref,
  ) => {
    const mode: InputSanitizeMode =
      sanitize === false
        ? "none"
        : (sanitize ?? inferSanitizeMode(type));

    const resolvedMax =
      typeof maxLength === "number"
        ? maxLength
        : defaultMaxLengthForMode(mode);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const next =
        mode === "none"
          ? event.target.value.slice(0, resolvedMax)
          : sanitizeInputValue(event.target.value, mode, resolvedMax);

      // Keep the DOM value in sync when we sanitize
      if (event.target.value !== next) {
        event.target.value = next;
      }

      onValueChange?.(next);
      onChange?.(event);
    };

    return (
      <input
        type={type}
        className={cn(
          inputVariants({ inputSize, tone }),
          error && "border-destructive focus-visible:ring-destructive/30",
          className,
        )}
        ref={ref}
        maxLength={resolvedMax}
        autoComplete={autoComplete}
        spellCheck={spellCheck ?? (type === "password" ? false : undefined)}
        onChange={handleChange}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
