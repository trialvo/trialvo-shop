"use client";

/**
 * components/single-order/SOPProductGallery.tsx — Image gallery with thumbnails
 */

import Image from "next/image";
import { useState, useEffect } from "react";

import type { SOPProductImage } from "@/types/single-order";
import { toSOPImageUrl } from "@/hooks/useSingleOrderProduct";

interface SOPProductGalleryProps {
  images: SOPProductImage[];
  productName: string;
  selectedColorId: number | null;
}

export function SOPProductGallery({
  images,
  productName,
  selectedColorId,
}: SOPProductGalleryProps) {
  const [activeImg, setActiveImg] = useState(0);

  // Reset active image when color changes
  useEffect(() => {
    setActiveImg(0);
  }, [selectedColorId]);

  // Clamp active index if images change
  const safeIndex = Math.min(activeImg, Math.max(0, images.length - 1));

  return (
    <div className="flex gap-4 flex-col col-span-12 md:flex-row md:col-span-6">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="order-2 w-full md:order-1 md:w-20">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[440px]">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`relative h-[72px] w-[72px] sm:h-20 sm:w-20 shrink-0 overflow-hidden border bg-card cursor-pointer transition-all duration-300 rounded ${
                  i === safeIndex
                    ? "border-foreground"
                    : "border-border hover:border-foreground/40"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <Image
                  src={toSOPImageUrl(img.path)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main image */}
      <div
        className={`order-1 w-full ${images.length > 1 ? "md:order-2" : ""}`}
      >
        <div className="relative aspect-square w-full overflow-hidden border border-border bg-card rounded">
          <Image
            src={toSOPImageUrl(images[safeIndex]?.path)}
            alt={productName}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 500px) 100vw, (max-width: 1024px) 100vw, 680px"
          />
        </div>
      </div>
    </div>
  );
}
