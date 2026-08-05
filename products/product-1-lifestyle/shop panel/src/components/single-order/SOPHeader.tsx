"use client";

/**
 * components/single-order/SOPHeader.tsx — Minimal branded header for SOP pages
 *
 * Uses shop-lifestyle design tokens. Renders outside the default layout.
 */

import Link from "next/link";

export function SOPHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-[0.15em] uppercase text-foreground hover:text-accent transition-colors"
          aria-label="Go to homepage"
        >
          LIFESTYLE
        </Link>
      </div>
    </header>
  );
}
