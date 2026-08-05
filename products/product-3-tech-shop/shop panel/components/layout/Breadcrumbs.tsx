"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import type { ReactElement } from "react";
import { buildBreadcrumbTrail } from "@/lib/breadcrumbs/buildBreadcrumbTrail";
import type { BreadcrumbItem, BreadcrumbTrail } from "@/lib/breadcrumbs/types";
import { cn } from "@/lib/utils";

export type { BreadcrumbItem, BreadcrumbTrail };

type BreadcrumbsProps = Readonly<{
  /** Extra crumbs after Home. Do not pass Home — it is injected once. */
  items?: BreadcrumbTrail;
  className?: string;
}>;

/** Shared hover: color shift + underline that grows from the left. */
const crumbLinkClass =
  "group/crumb relative inline-flex items-center gap-1 text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary";

function CrumbUnderline(): ReactElement {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-200 ease-out group-hover/crumb:scale-x-100 group-focus-visible/crumb:scale-x-100"
    />
  );
}

function BreadcrumbHomeLink(): ReactElement {
  return (
    <Link href="/" className={crumbLinkClass} aria-label="Home">
      <Home className="h-3.5 w-3.5 transition-transform duration-200 group-hover/crumb:-translate-y-px" />
      <span className="hidden sm:inline">Home</span>
      <CrumbUnderline />
    </Link>
  );
}

function BreadcrumbCrumbLink({
  item,
}: Readonly<{ item: BreadcrumbItem & { href: string } }>): ReactElement {
  return (
    <Link href={item.href} className={crumbLinkClass}>
      <span className="max-w-[160px] truncate sm:max-w-[220px]">{item.label}</span>
      <CrumbUnderline />
    </Link>
  );
}

function BreadcrumbCurrent({
  label,
}: Readonly<{ label: string }>): ReactElement {
  return (
    <span
      aria-current="page"
      className="max-w-[200px] truncate font-medium text-foreground sm:max-w-[280px]"
    >
      {label}
    </span>
  );
}

function BreadcrumbSeparator(): ReactElement {
  return (
    <ChevronRight
      className="mx-1.5 h-3 w-3 shrink-0 text-muted-foreground/50"
      aria-hidden
    />
  );
}

/**
 * App breadcrumb trail.
 * Always renders a single Home, then dynamic crumbs (from `items` or pathname).
 */
export function Breadcrumbs({
  items,
  className,
}: BreadcrumbsProps): ReactElement {
  const pathname = usePathname() ?? "/";
  const trail = buildBreadcrumbTrail(items, pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "mb-4 flex items-center overflow-x-auto whitespace-nowrap py-1 text-xs scrollbar-hidden",
        className,
      )}
    >
      <ol className="flex items-center">
        {trail.map((item, index) => {
          const isLast = index === trail.length - 1;
          const isHome = index === 0;

          return (
            <li key={`${item.label}-${item.href ?? "current"}-${index}`} className="inline-flex items-center">
              {index > 0 ? <BreadcrumbSeparator /> : null}

              {isHome ? (
                <BreadcrumbHomeLink />
              ) : isLast || !item.href ? (
                <BreadcrumbCurrent label={item.label} />
              ) : (
                <BreadcrumbCrumbLink item={{ ...item, href: item.href }} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
