"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeaderBrandProps {
  scrolled: boolean;
  mobileOpen: boolean;
  onMenuToggle: () => void;
}

/** Logo word-mark + md-only hamburger button */
export function HeaderBrand({ scrolled, mobileOpen, onMenuToggle }: HeaderBrandProps) {
  return (
    <>
      {/* Hamburger — visible only between md and lg; BottomNav handles < md */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="hidden md:flex lg:hidden flex-shrink-0 w-8 h-8 flex-col items-center justify-center gap-[5px] cursor-pointer text-header-foreground hover:text-header-accent transition-colors"
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
      >
        <span className={cn("block h-[1.5px] w-5 bg-current transition-all duration-300 origin-center", mobileOpen && "rotate-45 translate-y-[6.5px]")} />
        <span className={cn("block h-[1.5px] w-5 bg-current transition-all duration-300",               mobileOpen && "opacity-0 scale-x-0")} />
        <span className={cn("block h-[1.5px] w-5 bg-current transition-all duration-300 origin-center", mobileOpen && "-rotate-45 -translate-y-[6.5px]")} />
      </button>

      {/* Logo */}
      <Link
        href="/"
        className={cn(
          "font-display font-bold tracking-[0.12em] uppercase shrink-0",
          "text-header-foreground hover:text-header-accent transition-all duration-300",
          scrolled ? "text-lg lg:text-2xl" : "text-xl lg:text-[1.75rem]"
        )}
      >
        LIFESTYLE
      </Link>
    </>
  );
}
