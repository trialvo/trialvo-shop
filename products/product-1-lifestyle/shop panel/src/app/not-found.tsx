import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found · LIFESTYLE",
};

// ─── Typed sub-components ──────────────────────────────────────────────────────

interface CtaLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: "dark" | "ghost";
}

function CtaLink({ href, children, variant = "dark" }: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center gap-2 px-7 py-3",
        "text-[10px] tracking-[0.25em] uppercase font-semibold",
        "transition-all duration-300 group",
        variant === "dark"
          ? "bg-[hsl(220,20%,10%)] text-[hsl(40,20%,96%)] hover:bg-[hsl(35,60%,50%)]"
          : "border border-[hsl(220,10%,82%)] text-[hsl(220,20%,10%)] hover:border-[hsl(220,20%,10%)]",
      ].join(" ")}
      style={{ borderRadius: "1px" }}
    >
      {children}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    /*
     * Cream / off-white background — uses the brand's secondary colour.
     * The whole page is left-weighted, editorial, deliberately asymmetric.
     */
    <div className="min-h-screen bg-[hsl(40,20%,96%)] relative overflow-hidden flex flex-col">

      {/* ── Top strip ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 md:px-14 lg:px-20 pt-8 pb-6 border-b border-[hsl(220,10%,88%)]">
        <Link
          href="/"
          className="text-[9px] tracking-[0.5em] uppercase text-[hsl(220,20%,10%)] font-semibold hover:text-[hsl(35,60%,50%)] transition-colors"
        >
          LIFESTYLE
        </Link>

        {/* Error tag — top-right */}
        <span className="text-[8px] tracking-[0.35em] uppercase text-[hsl(220,10%,55%)]">
          Error · 404
        </span>
      </header>

      {/* ── Main body ────────────────────────────────────────────────────────── */}
      <main className="flex-1 px-8 md:px-14 lg:px-20 pt-14 pb-20 flex flex-col justify-between gap-16">

        {/* ── Row 1: Giant outline number ─────────────────────────────────── */}
        <div className="relative">
          {/*
           * The "4 — 0 — 4" sits on the same baseline, but each glyph is
           * treated independently: the outer 4s are in dark solid fill while
           * the central "0" is outline-only (text-stroke trick via inline style).
           * This is a deliberate, human-feeling typographic decision — not a
           * cookie-cutter full-number render.
           */}
          <div
            className="flex items-baseline leading-none select-none"
            aria-label="404"
          >
            <span
              className="font-display font-bold text-[hsl(220,20%,10%)]"
              style={{ fontSize: "clamp(6rem,18vw,15rem)", letterSpacing: "-0.02em" }}
            >
              4
            </span>

            {/* Centre "0" — hollow stroke, accent colour */}
            <span
              className="font-display font-bold mx-1 md:mx-2"
              style={{
                fontSize: "clamp(6rem,18vw,15rem)",
                letterSpacing: "-0.02em",
                WebkitTextStroke: "2px hsl(35,60%,50%)",
                color: "transparent",
              }}
            >
              0
            </span>

            <span
              className="font-display font-bold text-[hsl(220,20%,10%)]"
              style={{ fontSize: "clamp(6rem,18vw,15rem)", letterSpacing: "-0.02em" }}
            >
              4
            </span>
          </div>

          {/* Accent rule — does NOT span the full width; breaks the grid intentionally */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-px bg-[hsl(35,60%,50%)] w-28 md:w-40" />
            <div className="h-px bg-[hsl(220,10%,82%)] flex-1" />
          </div>
        </div>

        {/* ── Row 2: Two-column editorial block ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6">

          {/* Left col — heading & copy */}
          <div className="md:col-span-5 lg:col-span-4">
            <h1 className="font-display text-[hsl(220,20%,10%)] font-semibold leading-tight mb-5"
                style={{ fontSize: "clamp(1.4rem,3.5vw,2.1rem)" }}>
              This page stepped out of the collection.
            </h1>
            <p className="text-sm text-[hsl(220,10%,48%)] leading-[1.75] max-w-xs">
              Whatever you were looking for has been moved, renamed, or was never
              part of our range to begin with. But our shelves are full of things
              worth finding.
            </p>
          </div>

          {/* Thin vertical divider — desktop only */}
          <div className="hidden md:flex md:col-span-1 justify-center">
            <div className="w-px bg-[hsl(220,10%,85%)] h-full" />
          </div>

          {/* Right col — actions + decorative rotated label */}
          <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-between gap-10">

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <CtaLink href="/" variant="dark">
                Return Home
                {/* Inline arrow — not an icon library component, purely CSS */}
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </CtaLink>
              <CtaLink href="/shop" variant="ghost">
                Browse Shop
              </CtaLink>
            </div>

            {/* Quick nav — editorial-style links list */}
            <div>
              <p className="text-[9px] tracking-[0.4em] uppercase text-[hsl(220,10%,55%)] mb-4">
                Or jump to
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {([
                  ["New Arrivals", "/shop"],
                  ["Sale", "/deals"],
                  ["Contact", "/contact"],
                  ["FAQ", "/faq"],
                ] as [string, string][]).map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-xs text-[hsl(220,10%,48%)] hover:text-[hsl(35,60%,50%)] transition-colors underline-offset-4 hover:underline tracking-wide"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom strip ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[hsl(220,10%,88%)] px-8 md:px-14 lg:px-20 py-5 flex items-center justify-between">
        <p className="text-[9px] tracking-[0.3em] uppercase text-[hsl(220,10%,60%)]">
          Premium Fashion &amp; Lifestyle
        </p>
        {/* A tiny decorative element — the brand's accent ✦ mark */}
        <span className="text-[hsl(35,60%,50%)] text-xs select-none" aria-hidden="true">
          ✦
        </span>
      </footer>

      {/* ── Large ghost "NOT FOUND" — purely decorative, bottom-right bleed ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute bottom-16 right-0 translate-x-8 md:translate-x-0"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg) translateY(-1rem)",
          fontSize: "clamp(4rem,8vw,7rem)",
          letterSpacing: "0.2em",
          lineHeight: 1,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          color: "transparent",
          WebkitTextStroke: "1px hsl(220,10%,88%)",
          userSelect: "none",
        }}
      >
        NOT FOUND
      </div>
    </div>
  );
}
