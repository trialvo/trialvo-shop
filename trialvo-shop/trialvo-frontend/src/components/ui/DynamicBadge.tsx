import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable marketplace badge with fixed, high-contrast color pairs.
 * `surface="overlay"` = on photos; `surface="flat"` = on card/page background.
 */
export const dynamicBadgeVariants = cva(
  [
    "inline-flex max-w-full items-center gap-1 rounded-full border",
    "font-bold uppercase tracking-wide whitespace-nowrap",
    "transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        accent: "",
        trial: "",
        neutral: "",
        info: "",
        warning: "",
        category: "",
      },
      surface: {
        overlay: "shadow-md",
        flat: "",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px] leading-none",
        md: "px-2.5 py-1 text-[11px] leading-none",
      },
    },
    compoundVariants: [
      // Accent / bestseller — solid green + white text
      {
        variant: "accent",
        surface: "overlay",
        class: "border-transparent bg-[#1DBF73] text-white",
      },
      {
        variant: "accent",
        surface: "flat",
        class: "border-transparent bg-accent text-accent-foreground",
      },
      // Trial — soft green pair (never green-on-green wash)
      {
        variant: "trial",
        surface: "overlay",
        class: "border-[#1DBF73]/45 bg-white text-[#0F7A4A]",
      },
      {
        variant: "trial",
        surface: "flat",
        class: "border-emerald-200 bg-emerald-50 text-emerald-800",
      },
      // Neutral / digital
      {
        variant: "neutral",
        surface: "overlay",
        class: "border-zinc-200 bg-white text-zinc-800",
      },
      {
        variant: "neutral",
        surface: "flat",
        class: "border-zinc-200 bg-zinc-100 text-zinc-700",
      },
      // Info / demo
      {
        variant: "info",
        surface: "overlay",
        class: "border-sky-200 bg-white text-sky-800",
      },
      {
        variant: "info",
        surface: "flat",
        class: "border-sky-200 bg-sky-50 text-sky-800",
      },
      // Warning / video
      {
        variant: "warning",
        surface: "overlay",
        class: "border-amber-200 bg-white text-amber-900",
      },
      {
        variant: "warning",
        surface: "flat",
        class: "border-amber-200 bg-amber-50 text-amber-900",
      },
      // Category pill
      {
        variant: "category",
        surface: "overlay",
        class: "border-transparent bg-white/95 text-zinc-800",
      },
      {
        variant: "category",
        surface: "flat",
        class: "border-accent/20 bg-accent/10 text-accent",
      },
    ],
    defaultVariants: {
      variant: "neutral",
      surface: "flat",
      size: "sm",
    },
  },
);

export type DynamicBadgeVariant = NonNullable<
  VariantProps<typeof dynamicBadgeVariants>["variant"]
>;

export type DynamicBadgeProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> &
  VariantProps<typeof dynamicBadgeVariants> & {
    label: string;
    icon?: LucideIcon;
    /** Fill icon (e.g. featured star) */
    iconFilled?: boolean;
  };

export function DynamicBadge({
  label,
  icon: Icon,
  iconFilled = false,
  variant,
  surface,
  size,
  className,
  ...props
}: Readonly<DynamicBadgeProps>) {
  return (
    <span
      className={cn(dynamicBadgeVariants({ variant, surface, size }), className)}
      {...props}
    >
      {Icon ? (
        <Icon
          className={cn("h-3 w-3 shrink-0", iconFilled && "fill-current")}
          aria-hidden="true"
        />
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

export default DynamicBadge;
