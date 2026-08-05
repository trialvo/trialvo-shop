import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps {
  children?: ReactNode;

  /** xs=28px  sm=32px  md=36px  lg=40px  icon=36px */
  size?: "xs" | "sm" | "md" | "lg" | "icon";

  variant?: "primary" | "outline" | "ghost" | "danger" | "success";

  startIcon?: ReactNode;
  endIcon?: ReactNode;

  onClick?: () => void;
  disabled?: boolean;

  type?: "button" | "submit" | "reset";

  className?: string;

  /** For icon-only buttons (a11y) */
  ariaLabel?: string;

  /** Optional native tooltip */
  title?: string;

  /** ✅ optional loading */
  isLoading?: boolean;
  loadingText?: string;
}

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className,
  disabled = false,
  type = "button",
  ariaLabel,
  title,
  isLoading = false,
  loadingText,
}) => {
  const isIconOnly =
    !children &&
    (size === "icon" || (!!(startIcon || endIcon) && !loadingText));

  const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
    xs: "h-7 px-2 text-xs gap-1",
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-10 px-5 text-sm gap-2",
    icon: "h-9 w-9 p-0",
  };

  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: cn(
      "bg-brand-500 text-white shadow-sm",
      "hover:bg-brand-600 active:bg-brand-700",
      "disabled:bg-brand-300 dark:disabled:bg-brand-400/40"
    ),
    outline: cn(
      "bg-white text-gray-700 border border-gray-300 shadow-sm",
      "hover:bg-gray-50 active:bg-gray-100",
      "dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700",
      "dark:hover:bg-white/[0.04] dark:active:bg-white/[0.06]"
    ),
    ghost: cn(
      "bg-transparent text-gray-700",
      "hover:bg-gray-100 active:bg-gray-200",
      "dark:text-gray-200 dark:hover:bg-white/[0.06] dark:active:bg-white/[0.08]"
    ),
    danger: cn(
      "bg-red-600 text-white shadow-sm",
      "hover:bg-red-700 active:bg-red-800",
      "disabled:bg-red-300 dark:disabled:bg-red-400/40"
    ),
    success: cn(
      "bg-emerald-600 text-white shadow-sm",
      "hover:bg-emerald-700 active:bg-emerald-800",
      "disabled:bg-emerald-300 dark:disabled:bg-emerald-400/40"
    ),
  };

  const computedDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title}
      className={cn(
        // layout
        "inline-flex items-center justify-center whitespace-nowrap select-none",
        // shape
        "rounded-lg font-medium",
        // transitions
        "transition-all duration-150",
        // focus
        "outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1",
        "dark:focus-visible:ring-offset-gray-900",
        // disabled
        computedDisabled && "cursor-not-allowed opacity-60",
        // size + variant
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={computedDisabled ? undefined : onClick}
      disabled={computedDisabled}
    >
      {/* Loading */}
      {isLoading ? (
        <>
          <Spinner />
          {loadingText ? (
            <span className="truncate">{loadingText}</span>
          ) : null}
        </>
      ) : (
        <>
          {startIcon ? (
            <span className="inline-flex items-center">{startIcon}</span>
          ) : null}
          {children}
          {endIcon ? (
            <span className="inline-flex items-center">{endIcon}</span>
          ) : null}
        </>
      )}

      {/* a11y: if icon-only and no ariaLabel */}
      {isIconOnly && !ariaLabel ? (
        <span className="sr-only">Button</span>
      ) : null}
    </button>
  );
};

export default Button;
