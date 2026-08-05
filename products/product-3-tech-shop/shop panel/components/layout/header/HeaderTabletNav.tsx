"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { LayoutGrid } from "lucide-react";
import { DESKTOP_PRIMARY_LINKS } from "@/lib/nav/siteNav";
import { cn } from "@/lib/utils";

type HeaderTabletNavProps = Readonly<{
  onOpenCategories: () => void;
}>;

/**
 * Slim horizontal nav for tablet only (`768–1023px`).
 * Full mega menu starts at `lg`; this fills the gap without huge empty chrome.
 */
export function HeaderTabletNav({
  onOpenCategories,
}: HeaderTabletNavProps): ReactElement {
  return (
    <nav
      className="hidden border-t border-border md:block lg:hidden"
      aria-label="Tablet primary"
    >
      <div className="container flex items-center gap-0.5 overflow-x-auto py-1.5 scrollbar-hidden">
        <button
          type="button"
          onClick={onOpenCategories}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5",
            "bg-primary text-xs font-semibold text-primary-foreground",
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          Categories
        </button>

        {DESKTOP_PRIMARY_LINKS.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            prefetch
            className={cn(
              "shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary hover:text-primary",
              link.accent && "text-accent hover:text-accent/80",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default HeaderTabletNav;
