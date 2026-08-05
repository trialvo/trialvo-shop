import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FieldError } from "./FieldError";
import { Input } from "@/components/ui/input";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Lucide icon rendered on the left side of the input. */
  icon?: ReactNode;
  /** Validation error message shown below the input. */
  error?: string;
  /** Node rendered on the right (e.g. show/hide password toggle). */
  rightAddon?: ReactNode;
  /** Wrapper class override. */
  wrapperClassName?: string;
}

const inputBase =
  "w-full py-3 border rounded-sm bg-background text-foreground text-sm tracking-wide " +
  "placeholder:text-muted-foreground/60 focus:outline-none transition-colors";

/**
 * Controlled input used across auth forms.
 * Accepts an optional left icon, right addon, and displays a FieldError beneath.
 * Forwards its ref to the underlying <input> for React Hook Form compatibility.
 */
export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ icon, rightAddon, error, wrapperClassName, className, ...rest }, ref) => {
    const hasLeft = Boolean(icon);
    const hasRight = Boolean(rightAddon);

    return (
      <div className={cn("space-y-0.5", wrapperClassName)}>
        <div className="relative">
          {hasLeft && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <Input
            ref={ref}
            aria-invalid={Boolean(error)}
            className={cn(
              inputBase,
              "h-auto focus-visible:ring-0 focus-visible:ring-offset-0",
              hasLeft ? "pl-10" : "pl-4",
              hasRight ? "pr-10" : "pr-4",
              error
                ? "border-destructive focus:border-destructive"
                : "border-border focus:border-accent",
              className,
            )}
            {...rest}
          />
          {hasRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightAddon}
            </span>
          )}
        </div>
        <FieldError message={error} />
      </div>
    );
  },
);
AuthInput.displayName = "AuthInput";
