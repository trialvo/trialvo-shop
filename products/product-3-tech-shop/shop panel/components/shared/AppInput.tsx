"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InputSanitizeMode } from "@/lib/security/input";

export type AppInputProps = InputProps & {
  label?: string;
  hint?: string;
  errorMessage?: string;
  containerClassName?: string;
  labelClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Show show/hide toggle for password fields */
  passwordToggle?: boolean;
  /** Renders a red asterisk next to the label for required fields */
  required?: boolean;
};

/**
 * App-wide dynamic input — label, error, icons, password toggle,
 * and built-in sanitization (via Input).
 */
export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      label,
      hint,
      errorMessage,
      error,
      containerClassName,
      labelClassName,
      className,
      id,
      name,
      type = "text",
      leftIcon,
      rightIcon,
      passwordToggle,
      required = false,
      sanitize,
      ...props
    },
    ref,
  ) => {
    const inputId = id || name;
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const showToggle = Boolean(passwordToggle && isPassword);
    const resolvedType =
      showToggle && showPassword ? "text" : type;

    const hasError = Boolean(error || errorMessage);
    const inferredSanitize: InputSanitizeMode | false | undefined =
      sanitize !== undefined
        ? sanitize
        : isPassword
          ? "password"
          : undefined;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium mb-1 block text-foreground",
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

        <div className="relative">
          {leftIcon ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none [&_svg]:h-4 [&_svg]:w-4">
              {leftIcon}
            </span>
          ) : null}

          <Input
            ref={ref}
            id={inputId}
            name={name}
            type={resolvedType}
            error={hasError}
            sanitize={inferredSanitize}
            className={cn(
              leftIcon && "pl-10",
              (rightIcon || showToggle) && "pr-10",
              className,
            )}
            {...props}
          />

          {showToggle ? (
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          ) : rightIcon ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none [&_svg]:h-4 [&_svg]:w-4">
              {rightIcon}
            </span>
          ) : null}
        </div>

        {hint && !hasError ? (
          <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
        ) : null}
        {errorMessage ? (
          <p className="text-[11px] text-destructive mt-1" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
AppInput.displayName = "AppInput";

export default AppInput;
