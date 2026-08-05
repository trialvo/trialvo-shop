import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HeaderIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Visual emphasis for bordered control buttons */
  variant?: "ghost" | "outline";
};

/**
 * Shared header icon control — consistent hit area & hover states.
 */
export function HeaderIconButton({
  children,
  className,
  variant = "ghost",
  type = "button",
  ...props
}: Readonly<HeaderIconButtonProps>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition duration-200",
        "hover:bg-gray-100 hover:text-gray-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/35",
        "dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100",
        variant === "outline" &&
          "border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default HeaderIconButton;
