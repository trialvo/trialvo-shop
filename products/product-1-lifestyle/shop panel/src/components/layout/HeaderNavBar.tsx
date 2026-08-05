"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Menu, Package } from "lucide-react";
import Link from "next/link";

interface HeaderNavBarProps {
  megaMenuOpen: boolean;
  onMegaMenuToggle: () => void;
}

export function HeaderNavBar({ megaMenuOpen, onMegaMenuToggle }: Readonly<HeaderNavBarProps>) {
  return (
    <div className="hidden lg:block bg-header border-b border-header-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center h-11">

          {/* All Categories button */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={onMegaMenuToggle}
              aria-expanded={megaMenuOpen}
              aria-haspopup="dialog"
              className={cn(
                "flex items-center gap-2 h-11 px-4 border-r border-header-border",
                "text-[11px] tracking-[0.15em] uppercase font-semibold",
                "cursor-pointer transition-colors",
                megaMenuOpen
                  ? "text-header-accent bg-header-border/20"
                  : "text-header-foreground hover:text-header-accent"
              )}
            >
              <Menu size={15} />
              All Categories
              <ChevronDown
                size={11}
                className={cn("opacity-60 transition-transform duration-200", megaMenuOpen && "rotate-180")}
              />
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right utility links */}
          <div className="hidden xl:flex items-center gap-1 flex-shrink-0 border-l border-header-border pl-3 ml-2">
            <Link
              href="/deals"
              className="flex items-center gap-1.5 h-11 px-3 text-[11px] tracking-[0.12em] uppercase text-header-muted hover:text-header-accent transition-colors whitespace-nowrap font-medium"
            >
              Bulk &amp; Combo
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-1.5 h-11 px-3 text-[11px] tracking-[0.12em] uppercase text-header-muted hover:text-header-foreground transition-colors whitespace-nowrap"
            >
              <Package size={13} /> Orders
            </Link>
          </div>

        </nav>
      </div>
    </div>
  );
}
