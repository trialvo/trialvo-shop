import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SurfaceTone = "card" | "muted" | "accent" | "inverted";

const TONE: Record<SurfaceTone, string> = {
  card: "bg-card",
  muted: "bg-muted/50",
  accent: "border-accent/25 bg-accent/[0.05]",
  inverted: "border-primary-foreground/12 bg-primary-foreground/[0.06]",
};

export type SurfaceProps = {
  as?: ElementType;
  tone?: SurfaceTone;
  /** Adds the top-edge light catch */
  sheen?: boolean;
  /** Lift, deepen and tint the border on hover */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
  /** Forwarded to the rendered element — e.g. href when `as` is a link */
  [prop: string]: unknown;
};

/**
 * Elevated panel shared by every card on the site. Depth comes from the
 * layered `--shadow-card` stack rather than a border alone, which is the
 * difference between a card that looks placed on the page and one that looks
 * drawn onto it.
 */
export function Surface({
  as: Tag = "div",
  tone = "card",
  sheen = false,
  interactive = false,
  className,
  children,
  ...rest
}: Readonly<SurfaceProps>) {
  return (
    <Tag
      {...rest}
      className={cn(
        "surface",
        TONE[tone],
        sheen && "surface-sheen",
        interactive && "surface-interactive",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export default Surface;
