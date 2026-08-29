import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionTone = "plain" | "muted" | "raised" | "dark";
export type SectionPattern = "none" | "dots" | "grid" | "mesh" | "meshDots";
export type SectionSize = "sm" | "md" | "lg";
export type SectionDivider = "none" | "top" | "bottom" | "both";

const TONE: Record<SectionTone, string> = {
  plain: "bg-background text-foreground",
  muted: "bg-muted/40 text-foreground",
  raised: "bg-card text-foreground",
  dark: "bg-primary text-primary-foreground",
};

const SIZE: Record<SectionSize, string> = {
  sm: "py-12 md:py-16",
  md: "py-14 md:py-20",
  lg: "py-16 md:py-24",
};

const PATTERN: Record<SectionPattern, string | null> = {
  none: null,
  dots: "pattern-dots",
  grid: "pattern-grid",
  mesh: "mesh-accent",
  meshDots: "mesh-accent",
};

export type SectionProps = {
  id?: string;
  /** id of the heading that names this landmark */
  labelledBy?: string;
  tone?: SectionTone;
  pattern?: SectionPattern;
  size?: SectionSize;
  divider?: SectionDivider;
  as?: ElementType;
  className?: string;
  containerClassName?: string;
  /** Render children without the standard max-width container */
  bleed?: boolean;
  /**
   * Clip content to the band. Must be false when a child uses
   * `position: sticky`, since an `overflow` ancestor becomes its scrollport.
   */
  clip?: boolean;
  children: ReactNode;
  /** Forwarded to the rendered element — e.g. aria-label on an unheaded band */
  [prop: string]: unknown;
};

/**
 * Standard page band. Owns vertical rhythm, surface tone, the optional
 * decorative backdrop, and the fading hairline dividers between bands, so no
 * section has to reinvent any of it. The decoration always sits on its own
 * absolutely-positioned layer beneath the content, which keeps text contrast
 * unaffected by whatever pattern is chosen.
 */
export function Section({
  id,
  labelledBy,
  tone = "plain",
  pattern = "none",
  size = "md",
  divider = "none",
  as: Tag = "section",
  className,
  containerClassName,
  bleed = false,
  clip = true,
  children,
  ...rest
}: Readonly<SectionProps>) {
  const patternClass = PATTERN[pattern];
  const showTop = divider === "top" || divider === "both";
  const showBottom = divider === "bottom" || divider === "both";

  return (
    <Tag
      {...rest}
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative isolate",
        clip ? "overflow-hidden" : "overflow-visible",
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {patternClass ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10",
            patternClass,
            // Fade the pattern out toward the bottom so bands blend into
            // each other instead of ending on a hard seam.
            pattern === "dots" || pattern === "grid"
              ? "[mask-image:linear-gradient(to_bottom,black,transparent)]"
              : null,
          )}
        />
      ) : null}
      {pattern === "meshDots" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 pattern-dots [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        />
      ) : null}

      {showTop ? (
        <div aria-hidden="true" className="divider-fade absolute inset-x-0 top-0" />
      ) : null}
      {showBottom ? (
        <div
          aria-hidden="true"
          className="divider-fade absolute inset-x-0 bottom-0"
        />
      ) : null}

      {bleed ? (
        children
      ) : (
        <div className={cn("container-custom", containerClassName)}>{children}</div>
      )}
    </Tag>
  );
}

export default Section;
