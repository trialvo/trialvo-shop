import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EyebrowProps = {
  children: ReactNode;
  /** Use on dark surfaces where the label needs to read against white text */
  tone?: "default" | "inverted";
  className?: string;
};

/**
 * Small label above a section heading. Deliberately plain text — no pill,
 * border or dot — so the heading stays the focus of the section.
 */
export function Eyebrow({ children, tone = "default", className }: Readonly<EyebrowProps>) {
  return (
    <span
      className={cn(
        // 12px on phones, 11px from sm up: uppercase tracking at 11px is hard
        // to read on a small screen, especially in Bengali.
        "block text-xs font-semibold uppercase leading-none tracking-[0.16em] sm:text-[11px]",
        tone === "inverted" ? "text-primary-foreground/70" : "text-accent-strong",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Eyebrow;
