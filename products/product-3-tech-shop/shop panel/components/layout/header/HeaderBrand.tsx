import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

export type HeaderBrandPlacement = "start" | "center";

export type HeaderBrandProps = Readonly<{
  className?: string;
  placement?: HeaderBrandPlacement;
}>;

/**
 * Techshop wordmark. Parent owns layout position per breakpoint.
 */
export function HeaderBrand({
  className,
  placement = "start",
}: HeaderBrandProps): ReactElement {
  return (
    <Link
      href="/"
      className={cn(
        "font-heading shrink-0 font-bold text-primary",
        "text-lg sm:text-xl md:text-2xl",
        placement === "center" && "text-center tracking-tight",
        className,
      )}
      aria-label="Techshop home"
    >
      Tech<span className="text-accent">shop</span>
    </Link>
  );
}

export default HeaderBrand;
