import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable marketplace badge with fixed, high-contrast color pairs.
 * `surface="overlay"` = on photos; `surface="flat"` = on card/page background.
 */
/**
 * Marketplace marker rendered as plain text rather than a pill. On photos the
 * label leans on a text shadow instead of a filled chip, so the media stays
 * clean while the wording still reads at a glance.
 */
export const dynamicBadgeVariants = cva(
  [
    "inline-flex max-w-full items-center gap-1",
    "font-bold uppercase tracking-[0.12em] whitespace-nowrap",
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
        overlay: "[text-shadow:0_1px_3px_rgb(0_0_0/0.65)]",
        flat: "",
      },
      size: {
        // One step larger on phones — these caps sit at the readability floor.
        sm: "text-[11px] leading-none sm:text-[10px]",
        md: "text-xs leading-none sm:text-[11px]",
      },
    },
    compoundVariants: [
      { variant: "accent", surface: "overlay", class: "text-white" },
      { variant: "accent", surface: "flat", class: "text-accent-strong" },

      { variant: "trial", surface: "overlay", class: "text-white" },
      { variant: "trial", surface: "flat", class: "text-emerald-700" },

      { variant: "neutral", surface: "overlay", class: "text-white/90" },
      { variant: "neutral", surface: "flat", class: "text-muted-foreground" },

      { variant: "info", surface: "overlay", class: "text-white/90" },
      { variant: "info", surface: "flat", class: "text-sky-700" },

      { variant: "warning", surface: "overlay", class: "text-white/90" },
      { variant: "warning", surface: "flat", class: "text-amber-700" },

      { variant: "category", surface: "overlay", class: "text-white/90" },
      { variant: "category", surface: "flat", class: "text-accent-strong" },
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
