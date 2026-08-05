import React from "react";
import { useAppBranding } from "../../context/AppBrandingContext";
import { cn } from "../../lib/utils";

export type BrandLogoProps = {
  /** `full` = mark + wordmark. `icon` = mark only (collapsed sidebar). */
  variant?: "full" | "icon";
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
};

/**
 * Product-agnostic admin identity.
 * No store/brand SVG — works for fashion, tech, lifestyle, and any future app.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  className,
  alt,
  height,
}) => {
  const { branding } = useAppBranding();
  const label = branding.appShortName || "Admin";
  const accessibleName = alt ?? branding.appName;

  const markSize =
    height && height > 0
      ? Math.min(Math.max(height, 24), 40)
      : variant === "icon"
        ? 32
        : 36;

  return (
    <span
      role="img"
      aria-label={accessibleName}
      className={cn(
        "inline-flex max-w-full items-center gap-2.5 text-gray-900 dark:text-white",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-xs"
        style={{ width: markSize, height: markSize }}
      >
        {/* Simple geometric mark — not a product logo */}
        <svg
          width={Math.round(markSize * 0.5)}
          height={Math.round(markSize * 0.5)}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.95" />
          <rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.55" />
          <rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.55" />
          <rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.95" />
        </svg>
      </span>

      {variant === "full" ? (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-tight tracking-tight sm:text-base">
            {label}
          </span>
          <span className="block truncate text-[11px] font-medium leading-tight text-gray-500 dark:text-gray-400">
            Control panel
          </span>
        </span>
      ) : null}
    </span>
  );
};

export default BrandLogo;
