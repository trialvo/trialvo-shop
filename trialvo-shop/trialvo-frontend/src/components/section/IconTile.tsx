import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IconTileSize = "sm" | "md" | "lg";
export type IconTileTone = "accent" | "neutral" | "inverted";

const BOX: Record<IconTileSize, string> = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-11 w-11 rounded-xl",
  lg: "h-14 w-14 rounded-2xl",
};

const GLYPH: Record<IconTileSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const TONE: Record<IconTileTone, string> = {
  // A tinted gradient plus a ring reads richer than a flat fill at the same
  // contrast, and keeps the accent colour from feeling heavy.
  accent:
    "bg-gradient-to-br from-accent/[0.16] to-accent/[0.04] text-accent ring-1 ring-inset ring-accent/20",
  neutral:
    "bg-gradient-to-br from-foreground/[0.07] to-foreground/[0.02] text-foreground ring-1 ring-inset ring-border",
  inverted:
    "bg-primary-foreground/10 text-primary-foreground ring-1 ring-inset ring-primary-foreground/15",
};

export type IconTileProps = {
  icon?: LucideIcon;
  /** Use for step numbers or any non-icon glyph */
  children?: ReactNode;
  size?: IconTileSize;
  tone?: IconTileTone;
  className?: string;
};

/** Consistent container for a section's leading icon or step number. */
export function IconTile({
  icon: Icon,
  children,
  size = "md",
  tone = "accent",
  className,
}: Readonly<IconTileProps>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors",
        BOX[size],
        TONE[tone],
        className,
      )}
    >
      {Icon ? <Icon className={GLYPH[size]} aria-hidden="true" /> : children}
    </span>
  );
}

export default IconTile;
