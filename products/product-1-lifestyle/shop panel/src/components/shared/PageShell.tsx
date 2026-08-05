import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Consistent full-width page container used across all account pages.
 * Eliminates the repeated `max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12` div.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12",
        className
      )}
    >
      {children}
    </div>
  );
}
