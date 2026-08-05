import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HeaderToolbarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Right-side action cluster for the admin header.
 */
export function HeaderToolbar({
  children,
  className,
}: Readonly<HeaderToolbarProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Soft divider between toolbar groups */
export function HeaderToolbarDivider() {
  return (
    <span
      aria-hidden
      className="mx-0.5 hidden h-6 w-px bg-gray-200 sm:block dark:bg-gray-700"
    />
  );
}

export default HeaderToolbar;
