"use client";

import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import Link from "next/link";
import React from "react";
import { CiImageOff } from "react-icons/ci";
import { FiArrowRight } from "react-icons/fi";

export type ProductHeroProps = {
  title: string;
  subtitle?: string;
  imageSrc: string | undefined;
  ctaHref: string;
  ctaLabel: string;
  variant?: "overlay" | "below";
  heightClassName?: string;
  className?: string;
  rounded?: boolean;
};

const ProductHero: React.FC<ProductHeroProps> = ({
  title,
  subtitle,
  imageSrc,
  ctaHref,
  ctaLabel,
  variant = "overlay",
  heightClassName = "h-[260px]",
  className,
  rounded = false,
}) => {
  if (variant === "below") {
    return (
      <Link href={ctaHref} className={cn("group block w-full", className)}>
        <div
          className={cn(
            "relative w-full overflow-hidden border border-[#f1f1f1] bg-muted",
            heightClassName, // ✅ supports aspect-square
            rounded ? "rounded-xl" : "rounded-none",
          )}
        >
          {!imageSrc ? (
            <div className="flex h-full w-full items-center justify-center">
              <CiImageOff className="h-6 w-6 text-foreground/50" />
            </div>
          ) : (
            <ImageWithFallback
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover object-top",
                "transition-transform duration-200",
                "group-hover:scale-[1.03]",
              )}
              preload={false}
            />
          )}
        </div>

        <div className="mt-0.5 inline-flex items-center gap-2 text-black sm:mt-2">
          <span className="text-[10px] font-semibold sm:text-base">{ctaLabel}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            <FiArrowRight className="h-3 w-3 sm:h-6 sm:w-6" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-black text-white",
        rounded ? "rounded-xl" : "rounded-none",
        className,
      )}
    >
      <div className="absolute inset-0">
        {!imageSrc ? (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-6 w-6 text-foreground/50" />
          </div>
        ) : (
          <ImageWithFallback
            src={imageSrc}
            alt={title}
            fill
            sizes="100vw"
            className={cn(
              "object-cover",
              "transition-transform duration-200",
              "group-hover:scale-[1.03]",
            )}
            preload={false}
          />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      <div className={cn("relative z-10 flex flex-col justify-between p-6 sm:p-10", heightClassName)}>
        <div>
          <h1 className="font-serif text-5xl font-light italic tracking-wide sm:text-6xl">
            {title}
          </h1>

          {subtitle ? <p className="mt-4 max-w-md text-sm text-white/80">{subtitle}</p> : null}
        </div>

        <div className="flex items-center justify-between">
          <Link href={ctaHref} className="group inline-flex items-center gap-2 text-base font-medium">
            {ctaLabel}
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductHero;
