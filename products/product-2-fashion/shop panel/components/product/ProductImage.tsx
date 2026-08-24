"use client";

import { cn, toPublicUrl } from "@/lib/utils";
import * as React from "react";
import { CiImageOff } from "react-icons/ci";
import QuickAddButton from "./QuickAddButton";
import ImageWithFallback from "../common/ImageWithFallback";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  onQuickAdd?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  imageClass?: string;
  priority?: boolean;
  /** Always show Quick Add (mobile). Default: show on group hover only. */
  alwaysShowQuickAdd?: boolean;
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  onQuickAdd,
  className,
  imageClass,
  priority = false,
  alwaysShowQuickAdd = false,
}) => {
  const safeSrc = typeof src === "string" && src.trim().length > 0 ? src.trim() : null;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div className={cn("relative h-full w-full overflow-hidden bg-muted", imageClass)}>
        {safeSrc ? (
          <ImageWithFallback
            src={toPublicUrl(safeSrc) || ""}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-14 w-14 text-foreground/50" />
          </div>
        )}

        {onQuickAdd ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-10",
              alwaysShowQuickAdd
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100",
            )}
          >
            <QuickAddButton onClick={onQuickAdd} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductImage;
