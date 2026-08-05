"use client";

import { useCallback, useState } from "react";
import { IMAGE_URL } from "@/config/env";

/* ── Inline placeholder SVG — no external file needed ───────────────── */
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cg transform='translate(200,200)'%3E%3Crect x='-40' y='-30' width='80' height='60' rx='4' fill='%23d1d5db' stroke='%239ca3af' stroke-width='1.5'/%3E%3Ccircle cx='-18' cy='-12' r='7' fill='%239ca3af'/%3E%3Cpolygon points='-32,22 -4,-8 12,10 40,22 40,22 -32,22' fill='%239ca3af' opacity='0.7'/%3E%3Cpolygon points='4,22 20,-2 40,22' fill='%236b7280' opacity='0.5'/%3E%3C/g%3E%3Ctext x='200' y='250' text-anchor='middle' font-family='system-ui,sans-serif' font-size='13' fill='%239ca3af'%3ENo image%3C/text%3E%3C/svg%3E`;

const GCS_BUCKET_ORIGIN = "https://storage.googleapis.com/graduate-ecom-mumbai-641431966702";

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "onError"
> & {
  /** Optional custom placeholder (URL or data-uri). Defaults to built-in SVG. */
  placeholder?: string;
};

/**
 * Drop-in `<img>` replacement that:
 * 1. Shows a placeholder when `src` is empty / null / undefined
 * 2. Swaps to the placeholder on network or decode errors
 * 3. Never shows a broken-image icon
 */
const SafeImage = ({
  src,
  alt = "",
  placeholder = PLACEHOLDER_SVG,
  className,
  ...rest
}: SafeImageProps) => {
  const [retrySrc, setRetrySrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    // If loading from the GCS bucket fails, retry against this instance's
    // IMAGE_URL (trial API port / CDN). Never hardcode a local dev port —
    // each hosted trial publishes the API on a different host port.
    if (
      src &&
      typeof src === "string" &&
      src.includes("storage.googleapis.com") &&
      src.includes("/uploads/") &&
      !retrySrc &&
      IMAGE_URL
    ) {
      const localFallback = src.replace(GCS_BUCKET_ORIGIN, IMAGE_URL.replace(/\/+$/, ""));
      setRetrySrc(localFallback);
    } else if (!hasError) {
      setHasError(true);
    }
  }, [src, retrySrc, hasError]);

  // Determine effective src
  const effectiveSrc = hasError
    ? placeholder
    : !src || (typeof src === "string" && src.trim() === "")
      ? placeholder
      : retrySrc || src;

  return (
    <img
      {...rest}
      src={effectiveSrc as string}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default SafeImage;
export { PLACEHOLDER_SVG };
