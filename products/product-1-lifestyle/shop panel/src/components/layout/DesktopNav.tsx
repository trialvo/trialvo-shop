"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavCategory } from "@/types";

interface DesktopNavProps {
  categories: NavCategory[];
  activeSubmenu: string | null;
  onSubmenuChange: (label: string | null) => void;
}

/**
 * Desktop horizontal nav bar with animated dropdown submenus and underline hover effect.
 * Hidden below lg breakpoint. Extracted from Header.
 */
export function DesktopNav({ categories, activeSubmenu, onSubmenuChange }: DesktopNavProps) {
  return (
    <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
      {categories.map((cat) => (
        <div
          key={cat.label}
          className="relative group"
          onMouseEnter={() => onSubmenuChange(cat.label)}
          onMouseLeave={() => onSubmenuChange(null)}
        >
          <Link
            href={cat.href}
            className={cn(
              "px-3 xl:px-4 py-2 text-[11px] xl:text-xs tracking-[0.18em] uppercase font-light",
              "transition-colors duration-200 flex items-center gap-1 relative",
              cat.featured ? "text-header-accent hover:text-header-accent/80" : "text-header-muted hover:text-header-foreground"
            )}
          >
            {cat.label}
            {cat.submenu && (
              <ChevronDown
                size={10}
                className={cn(
                  "opacity-50 transition-transform duration-200",
                  activeSubmenu === cat.label && "rotate-180"
                )}
              />
            )}
            {/* Underline animation */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-header-accent transition-[transform] duration-300 origin-center w-3/4 scale-x-0 group-hover:scale-x-100" />
          </Link>

          {/* Dropdown */}
          {cat.submenu && (
            <div
              className={cn(
                "absolute top-full left-0 bg-header border border-header-border min-w-[220px] py-2 z-50",
                "transition-all duration-200 origin-top",
                activeSubmenu === cat.label
                  ? "opacity-100 scale-y-100 translate-y-0"
                  : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
              )}
            >
              {cat.submenu.map((item, i) => (
                <Link
                  key={item}
                  href={cat.submenuHrefs?.[i] ?? `/shop?category=${encodeURIComponent(cat.label)}`}
                  className="block px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase text-header-muted hover:text-header-foreground hover:bg-header-border/30 transition-all duration-150 hover:pl-6"
                  style={{ transitionDelay: `${i * 20}ms` }}
                >
                  {item}
                </Link>
              ))}
            </div>
          )}

        </div>
      ))}
    </nav>
  );
}
