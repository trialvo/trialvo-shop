import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";

type ViewAllLinkProps = {
  href: string;
  children?: ReactNode;
  className?: string;
};

/** Consistent “View All” Next.js link + shared right arrow. */
export function ViewAllLink({
  href,
  children = "View All",
  className,
}: ViewAllLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link",
        className,
      )}
    >
      <span>{children}</span>
      <RightArrowIcon className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
    </Link>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** Optional leading icon inside accent tile */
  icon?: ReactNode;
  href?: string;
  linkLabel?: string;
  /** Right-side slot (countdown, custom actions). Wins over href when both set. */
  action?: ReactNode;
  align?: "start" | "center";
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  iconClassName?: string;
};

/**
 * Shared polished section header for home (and similar) sections.
 */
export function SectionHeader({
  title,
  subtitle,
  icon,
  href,
  linkLabel = "View All",
  action,
  align = "start",
  className,
  titleClassName,
  subtitleClassName,
  iconClassName,
}: SectionHeaderProps) {
  const isCenter = align === "center";

  return (
    <div
      className={cn(
        "mb-6 md:mb-8",
        isCenter
          ? "text-center"
          : "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div
        className={cn(
          "min-w-0",
          icon && !isCenter && "flex items-center gap-3",
          isCenter && "mx-auto max-w-2xl",
          icon && isCenter && "flex flex-col items-center",
        )}
      >
        {icon ? (
          <div
            className={cn(
              "h-9 w-9 rounded-sm gradient-accent text-accent-foreground flex items-center justify-center shrink-0 [&_svg]:h-5 [&_svg]:w-5",
              isCenter && "mb-3",
              iconClassName,
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h2
            className={cn(
              "font-heading text-xl md:text-3xl font-bold tracking-tight text-foreground",
              titleClassName,
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={cn(
                "text-muted-foreground text-xs md:text-sm mt-1 text-pretty",
                subtitleClassName,
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {action ? (
        <div className={cn("shrink-0", isCenter && "mt-4 flex justify-center")}>
          {action}
        </div>
      ) : href ? (
        <div
          className={cn(
            "shrink-0",
            isCenter ? "mt-4 flex justify-center" : "hidden sm:block",
          )}
        >
          <ViewAllLink href={href}>{linkLabel}</ViewAllLink>
        </div>
      ) : null}
    </div>
  );
}

export default SectionHeader;
