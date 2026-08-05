"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Additional class names for the input element itself */
  inputClassName?: string;
  /** Additional class names for the wrapper div */
  wrapperClassName?: string;
}

/**
 * Reusable form field: label + input + error message.
 * Forwards ref to the underlying <input> for React Hook Form compatibility.
 */
const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, inputClassName, wrapperClassName, id, ...inputProps }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("space-y-1.5", wrapperClassName)}>
        <label
          htmlFor={fieldId}
          className="text-xs tracking-wide text-muted-foreground uppercase block"
        >
          {label}
        </label>
        <Input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            "h-auto focus-visible:ring-0 focus-visible:ring-offset-0",
            "w-full px-4 py-3 border rounded bg-background text-foreground text-sm",
            "placeholder:text-muted-foreground/40 focus:outline-none transition-colors",
            error
              ? "border-destructive focus:border-destructive"
              : "border-border focus:border-accent",
            inputClassName
          )}
          {...inputProps}
        />
        {error && (
          <p
            id={`${fieldId}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle size={11} className="shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };
