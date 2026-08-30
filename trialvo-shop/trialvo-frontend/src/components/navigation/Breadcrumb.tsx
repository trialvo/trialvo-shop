import { ChevronRight } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  /** App path, localized by the link itself. Omit for the current page. */
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Page breadcrumb shared by every detail page. The 12px label keeps the trail
 * quiet, while each link carries a 28px tap height so it stays comfortable on
 * a phone without changing the visual rhythm. The trail wraps rather than
 * scrolls, which is what keeps long product titles from widening the page.
 */
export function Breadcrumb({ items, className }: Readonly<BreadcrumbProps>) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-x-1.5"
            >
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : null}

              {item.href && !isLast ? (
                <LocalizedLink
                  href={item.href}
                  className="inline-flex min-h-[1.75rem] items-center transition-colors hover:text-foreground"
                >
                  {item.label}
                </LocalizedLink>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "block max-w-[16rem] truncate leading-[1.75rem]",
                    isLast ? "font-medium text-foreground" : "text-foreground/70",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
