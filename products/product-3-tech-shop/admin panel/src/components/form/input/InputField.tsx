import * as React from "react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onWheel?: (e: React.WheelEvent<HTMLInputElement>) => void;
  className?: string;
  autoComplete?: string;

  // ✅ allow both number & string (fixes TS error)
  min?: string | number;
  max?: string | number;

  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;

  /** ✅ prefix / suffix icon (use lucide icon) */
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;

  /** Optional wrapper class */
  wrapperClassName?: string;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
  onWheel,
  className,
  autoComplete,
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  startIcon,
  endIcon,
  wrapperClassName,
}) => {
  const stateClass = disabled
    ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed opacity-70 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    : error
      ? "bg-white border-error-500 text-gray-900 focus-visible:border-error-500 dark:bg-gray-900 dark:text-white/90 dark:border-error-500"
      : success
        ? "bg-white border-success-500 text-gray-900 focus-visible:border-success-500 dark:bg-gray-900 dark:text-white/90 dark:border-success-500"
        : "bg-white border-gray-200 text-gray-900 focus-visible:border-brand-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus-visible:border-brand-500";

  const numberInputClass =
    type === "number"
      ? "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      : "";

  return (
    <div className={cn("w-full min-w-[100px]", wrapperClassName)}>
      <div className="relative w-full">
        {startIcon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30">
            {startIcon}
          </div>
        ) : null}

        {endIcon ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30">
            {endIcon}
          </div>
        ) : null}

        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onWheel={onWheel}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            // ✅ radius max 4px
            "h-10 w-full rounded-xl border px-3 text-sm",
            // ✅ no focus ring / no box shadow; focus is border-only
            "outline-none focus-visible:outline-none",
            "transition-colors duration-150",
            "placeholder:text-gray-400 dark:placeholder:text-white/30",
            // ✅ spacing when icons exist
            startIcon && "pl-10",
            endIcon && "pr-10",
            numberInputClass,
            stateClass,
            className,
          )}
        />
      </div>

      {hint ? (
        <p
          className={cn(
            "mt-1.5 text-xs",
            error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500 dark:text-gray-400",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default Input;
