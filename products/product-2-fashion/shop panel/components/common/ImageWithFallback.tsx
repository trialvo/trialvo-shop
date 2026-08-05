"use client";

import { IMAGE_URL } from "@/config/env";
import { cn } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { CiImageOff } from "react-icons/ci";

const GCS_ORIGINS = [
  "https://storage.googleapis.com/graduate-ecom-mumbai-641431966702",
  "https://storage.googleapis.com/graduate-ecom",
];

/** If GCS fails (trial/demo local uploads), retry against IMAGE_URL. */
function gcsFallbackSrc(src: ImageProps["src"]): string | null {
  if (typeof src !== "string" || !src.includes("storage.googleapis.com")) {
    return null;
  }
  if (!src.includes("/uploads/") || !IMAGE_URL) return null;
  const base = IMAGE_URL.replace(/\/+$/, "");
  if (!base || base.includes("storage.googleapis.com")) return null;
  for (const origin of GCS_ORIGINS) {
    if (src.startsWith(origin)) {
      const relative = src.slice(origin.length);
      return `${base}${relative.startsWith("/") ? relative : `/${relative}`}`;
    }
  }
  const idx = src.indexOf("/uploads/");
  return idx >= 0 ? `${base}${src.slice(idx)}` : null;
}

type Props = Omit<ImageProps, "src" | "alt"> & {
  src: ImageProps["src"];
  alt: string;

  useIconFallback?: boolean;

  wrapperClassName?: string;

  fallbackClassName?: string;

  /** Max number of retry attempts on error (default: 3) */
  maxRetries?: number;
};

// Soft gray blur placeholder
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iYiI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMjAiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2U1ZTdlYiIgZmlsdGVyPSJ1cmwoI2IpIi8+PC9zdmc+";

// Retry delays: 2s, 5s, 10s (exponential backoff)
const RETRY_DELAYS = [2000, 5000, 10000];

const ImageWithFallback: React.FC<Props> = ({
  src,
  alt,
  useIconFallback = true,
  wrapperClassName,
  fallbackClassName,
  onError,
  fill,
  className,
  maxRetries = 3,
  ...rest
}) => {

  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [imgKey, setImgKey] = React.useState(0); // Force remount on retry
  const [overrideSrc, setOverrideSrc] = React.useState<string | null>(null);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const effectiveSrc = overrideSrc || src;

  // Reset everything when src changes
  React.useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(0);
    setImgKey(0);
    setOverrideSrc(null);
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [src]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    onError?.(e);

    // Trial/demo: GCS bucket has no local uploads — rebase once onto IMAGE_URL
    if (!overrideSrc) {
      const local = gcsFallbackSrc(src);
      if (local) {
        setOverrideSrc(local);
        setHasError(false);
        setIsLoaded(false);
        setImgKey((k) => k + 1);
        return;
      }
    }

    if (retryCount < maxRetries) {
      const delay = RETRY_DELAYS[retryCount] ?? 10000;
      retryTimerRef.current = setTimeout(() => {
        setRetryCount((c) => c + 1);
        // Force remount with the current src — no cache-busting params
        setImgKey((k) => k + 1);
        setHasError(false);
        setIsLoaded(false);
      }, delay);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const fallbackEl = (
    <div className={cn("flex h-full w-full items-center justify-center", fallbackClassName)}>
      <CiImageOff className="h-14 w-14 text-foreground/50" />
    </div>
  );

  const blurProps = {
    placeholder: "blur" as const,
    blurDataURL: BLUR_DATA_URL,
  };

  // Show fallback only after all retries exhausted
  if (useIconFallback && hasError) {
    if (fill) return <div className={cn("relative h-full w-full", wrapperClassName)}>{fallbackEl}</div>;
    return <div className={cn(wrapperClassName)}>{fallbackEl}</div>;
  }

  // Shimmer overlay while loading
  const shimmerOverlay = !isLoaded && !hasError ? (
    <div className="absolute inset-0 z-10 overflow-hidden bg-gray-100 animate-pulse">
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        style={{ animation: "shimmer 1.5s ease-in-out infinite" }}
      />
    </div>
  ) : null;

  if (fill) {
    return (
      <div className={cn("relative h-full w-full", wrapperClassName)}>
        {shimmerOverlay}
        <Image
          key={imgKey}
          {...rest}
          {...blurProps}
          fill
          unoptimized
          src={effectiveSrc}
          alt={alt}
          className={cn(
            className,
            "transition-all duration-500 ease-out",
            isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-sm",
          )}
          onError={handleError}
          onLoad={handleLoad}
        />
      </div>
    );
  }

  return (
    <span className={cn("relative inline-block", wrapperClassName)}>
      {shimmerOverlay}
      <Image
        key={imgKey}
        {...rest}
        {...blurProps}
        unoptimized
        src={effectiveSrc}
        alt={alt}
        className={cn(
          className,
          "transition-all duration-500 ease-out",
          isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[1.02] blur-sm",
        )}
        onError={handleError}
        onLoad={handleLoad}
      />
    </span>
  );
};

export default ImageWithFallback;
