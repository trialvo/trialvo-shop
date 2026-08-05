import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveContrastingButtonClasses } from "@/lib/ui/buttonTone";

/**
 * Variants keep fill + text as contrasting pairs.
 * `onDark` is for CTAs on photos / dark campaign panels.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current rounded-sm",
  {
    variants: {
      variant: {
        default:
          "gradient-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90",
        primary:
          "gradient-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90",
        accent:
          "gradient-accent text-accent-foreground font-semibold shadow-sm hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-border bg-card text-foreground hover:bg-secondary hover:text-secondary-foreground",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
        /** Light text on dark media / campaign surfaces — never use primary fill here */
        onDark:
          "border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        xs: "h-8 px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

function buildButtonClassName(
  variant: ButtonProps["variant"],
  size: ButtonProps["size"],
  fullWidth: boolean | undefined,
  className: string | undefined,
) {
  const base = cn(
    buttonVariants({ variant, size }),
    fullWidth && "w-full",
    className,
  );
  // Guarantee fill ≠ text: strip colliding text-* then apply paired foreground
  return resolveContrastingButtonClasses(base);
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;
    const classes = buildButtonClassName(variant, size, fullWidth, className);

    if (asChild && !isLoading) {
      return (
        <Comp className={classes} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <button
        type={type}
        className={classes}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {isLoading && loadingText ? loadingText : children}
        {!isLoading ? rightIcon : null}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants, buildButtonClassName };
