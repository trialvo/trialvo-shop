import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Shows a spinner and disables the button when true. */
  isLoading?: boolean;
  /** Label shown in the idle state. */
  label: string;
  /** Optional icon appended after the label in the idle state. */
  trailingIcon?: ReactNode | LucideIcon;
}

/**
 * Full-width primary submit button used across auth forms.
 * Handles loading state with an accessible spinner automatically.
 */
export function AuthSubmitButton({
  isLoading = false,
  label,
  trailingIcon,
  className,
  disabled,
  ...rest
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      className={cn(
        "h-auto w-full bg-primary text-primary-foreground py-3.5",
        "text-xs tracking-[0.2em] uppercase font-medium",
        "hover:bg-accent hover:text-accent-foreground transition-all duration-300",
        "flex items-center justify-center gap-2",
        "focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60 rounded-sm",
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" aria-label="Loading…" />
      ) : (
        <>
          {label}
          {trailingIcon}
        </>
      )}
    </Button>
  );
}
