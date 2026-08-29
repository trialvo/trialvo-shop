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
        "block text-[11px] font-semibold uppercase leading-none tracking-[0.16em]",
        tone === "inverted" ? "text-primary-foreground/70" : "text-accent-strong",
        className,
      )}
    >
      {children}
    </span>
  );
}

export default Eyebrow;
