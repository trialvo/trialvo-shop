import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionHeaderProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Visual tone when placed on dark/primary surfaces */
  tone?: "default" | "onPrimary";
  action?: ReactNode;
  className?: string;
};

/**
 * Shared marketplace section header — one title, optional short support line.
 * Keeps every home section visually consistent without repeating markup.
 */
export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
  action,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  const onPrimary = tone === "onPrimary";

  return (
    <div
      className={cn(
        "mb-10 md:mb-12",
        centered
          ? "text-center"
          : "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn(centered && "mx-auto max-w-2xl")}>
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={id}
          className={cn(
            "font-display text-3xl font-semibold tracking-tight md:text-4xl",
            onPrimary ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-3 text-base md:text-lg",
              centered ? "mx-auto max-w-xl" : "max-w-xl",
              onPrimary ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action && !centered ? <div className="shrink-0">{action}</div> : null}
      {action && centered ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export default SectionHeader;
