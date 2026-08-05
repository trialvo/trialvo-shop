"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductImage } from "@/lib/api/product/service";
import { cn, toPublicUrl } from "@/lib/utils";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  images: ProductImage[];
  /** When set, only images matching the selected SKU (color+size) OR shared images (sku_id=null) are shown */
  selectedColorId?: number;
  selectedVariantId?: number;
};

type GalleryImage = ProductImage & {
  _src: string;
  _key: string;
  /** True when this image matches the currently selected color/size filter */
  _isMatch: boolean;
};

const ProductGallery: React.FC<Props> = ({ images, selectedColorId, selectedVariantId }) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resolve all images to safe src strings
  const allSafeImages = useMemo<GalleryImage[]>(
    () =>
      (Array.isArray(images) ? images : [])
        .map((img, idx) => {
          const maybeSrc = toPublicUrl(img?.path) ?? img?.path;
          const src = typeof maybeSrc === "string" ? maybeSrc.trim() : "";
          if (!src) return null;
          return { ...img, _src: src, _key: `${img?.id ?? "img"}-${idx}` };
        })
        .filter((img): img is GalleryImage => Boolean(img)),
    [images],
  );

  // Filter by SKU color+size
  // Logic:
  //  1. If no images have sku assignments → show all (backwards compatible)
  //  2. Otherwise: show shared (sku_id null) + images where sku_color_id matches selected color
  //     If a size is also selected: further narrow to images where sku_variant_id matches OR sku_variant_id is null
  // Annotate each image as matching or not — all images always shown,
  // but non-matching ones are visually dimmed.
  // Logic:
  //  - No assignments on any image → all match (backwards compatible)
  //  - sku_id null (shared) → always matches
  //  - colorId selected: sku_color_id must match
  //  - variantId selected (after color): sku_variant_id must match too
  //  - If NO images match the current filter at all (e.g. color with no assigned images)
  //    → show all as matching (generic fallback, lets users see product photos while still buying)
  const safeImages = useMemo<GalleryImage[]>(() => {
    const hasSkuAssignments = allSafeImages.some((img) => img.sku_id != null);
    const anyFilter = !!(selectedColorId || selectedVariantId);

    // Helper: does a single image match the current filter?
    const isMatchFn = (img: GalleryImage): boolean => {
      if (img.sku_id == null) return true; // shared images always match
      if (selectedColorId && img.sku_color_id !== selectedColorId) return false;
      if (selectedVariantId && img.sku_variant_id != null && img.sku_variant_id !== selectedVariantId) return false;
      return true;
    };

    if (!hasSkuAssignments || !anyFilter) {
      // No SKU assignments or no filter active → all are full brightness
      return allSafeImages.map((img) => ({ ...img, _isMatch: true }));
    }

    // Check whether at least one image matches (including shared images)
    const anyMatch = allSafeImages.some(isMatchFn);

    // If NOTHING matches (e.g. user selected a color that has no assigned image),
    // fall back to showing all images at full brightness rather than dimming everything.
    return allSafeImages.map((img) => ({
      ...img,
      _isMatch: anyMatch ? isMatchFn(img) : true,
    }));
  }, [allSafeImages, selectedColorId, selectedVariantId]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const active = safeImages[activeIndex];
  const imageSrc = active?._src ?? "";
  const [thumbsApi, setThumbsApi] = useState<CarouselApi | null>(null);
  const [canScrollThumbPrev, setCanScrollThumbPrev] = useState(false);
  const [canScrollThumbNext, setCanScrollThumbNext] = useState(false);
  const [isMagnifierVisible, setIsMagnifierVisible] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageNatural, setImageNatural] = useState<{ width: number; height: number } | null>(null);
  const [magnifierPos, setMagnifierPos] = useState({
    x: 0,
    y: 0,
    bgX: 0,
    bgY: 0,
    originX: 50,
    originY: 50,
  });
  const magnifierSize = 200;
  const zoom = 1;
  const zoomScale = 2.2;
  const rafRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const scrollThumbToIndex = useCallback(
    (index: number) => {
      if (!thumbsApi) return;
      const maxSnapIndex = thumbsApi.scrollSnapList().length - 1;
      if (maxSnapIndex < 0) return;
      thumbsApi.scrollTo(Math.max(0, Math.min(index, maxSnapIndex)));
    },
    [thumbsApi],
  );

  const stopThumbEventPropagation = (
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.TouchEvent<HTMLButtonElement>
      | React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
  };

  const updateMagnifier = (x: number, y: number) => {
    if (isMobile) {
      setIsMagnifierVisible(false);
      return;
    }
    if (!containerRef.current || !imageSrc || !imageNatural) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = Math.min(rect.width / imageNatural.width, rect.height / imageNatural.height);
    const imageWidth = imageNatural.width * scale;
    const imageHeight = imageNatural.height * scale;
    const ratioX = imageNatural.width / imageWidth;
    const ratioY = imageNatural.height / imageHeight;
    const offsetX = (rect.width - imageWidth) / 2;
    const offsetY = (rect.height - imageHeight) / 2;
    const withinX = x >= offsetX && x <= offsetX + imageWidth;
    const withinY = y >= offsetY && y <= offsetY + imageHeight;

    if (!withinX || !withinY) {
      setIsMagnifierVisible(false);
      return;
    }

    const minLensX = offsetX + magnifierSize / 2;
    const maxLensX = offsetX + imageWidth - magnifierSize / 2;
    const minLensY = offsetY + magnifierSize / 2;
    const maxLensY = offsetY + imageHeight - magnifierSize / 2;
    const clampedX = Math.max(minLensX, Math.min(x, maxLensX));
    const clampedY = Math.max(minLensY, Math.min(y, maxLensY));
    const xInImage = x - offsetX;
    const yInImage = y - offsetY;
    const bgX = xInImage * ratioX * zoom - magnifierSize / 2;
    const bgY = yInImage * ratioY * zoom - magnifierSize / 2;
    const originX = (xInImage / imageWidth) * 100;
    const originY = (yInImage / imageHeight) * 100;
    setIsMagnifierVisible(true);
    setMagnifierPos({ x: clampedX, y: clampedY, bgX, bgY, originX, originY });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastPosRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const pos = lastPosRef.current;
        if (pos) updateMagnifier(pos.x, pos.y);
      });
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const touch = event.touches[0];
    if (!rect || !touch) return;
    lastPosRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const pos = lastPosRef.current;
        if (pos) updateMagnifier(pos.x, pos.y);
      });
    }
  };

  const showThumbArrows = useMemo(() => {
    const len = allSafeImages.length;
    return isMobile ? len > 4 : len >= 5;
  }, [isMobile, allSafeImages.length]);

  React.useEffect(() => {
    if (safeImages.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, safeImages.length - 1));
  }, [safeImages.length]);

  // Reset to first image when color or variant filter changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [selectedColorId, selectedVariantId]);

  React.useEffect(() => {
    setIsMagnifierVisible(false);
    setIsZoomed(false);
    setImageNatural(null);
  }, [imageSrc]);

  React.useEffect(() => {
    if (!thumbsApi) return;
    const update = () => {
      setCanScrollThumbPrev(thumbsApi.canScrollPrev());
      setCanScrollThumbNext(thumbsApi.canScrollNext());
    };
    update();
    thumbsApi.on("select", update);
    thumbsApi.on("reInit", update);
    return () => {
      thumbsApi.off("select", update);
      thumbsApi.off("reInit", update);
    };
  }, [thumbsApi]);

  React.useEffect(() => {
    if (!thumbsApi || safeImages.length === 0) return;
    scrollThumbToIndex(activeIndex);
  }, [thumbsApi, activeIndex, safeImages.length, scrollThumbToIndex]);

  return (
    <div
      className={cn(
        "flex gap-4",
        isMobile ? "flex-col col-span-12" : "flex-row col-span-6",
      )}
    >
      <div className={cn(isMobile ? "order-2 w-full" : "order-1 w-20")}>
        <Carousel
          orientation={isMobile ? "horizontal" : "vertical"}
          setApi={setThumbsApi}
          opts={{
            align: "start",
            axis: isMobile ? "x" : "y",
            containScroll: "keepSnaps",
            dragFree: isMobile,
            watchDrag: isMobile,
          }}
          className="relative"
        >
          <CarouselContent
            className={cn(
              isMobile ? "-ml-2 h-auto flex-row touch-pan-x" : "-mt-2 h-110 flex-col",
            )}
          >
            {safeImages.map((img, idx) => {
              const selected = idx === activeIndex;

              return (
                <CarouselItem
                  key={img._key}
                  className={cn(isMobile ? "pl-2 basis-auto" : "pt-2 basis-auto")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      scrollThumbToIndex(idx);
                    }}
                    onMouseDown={stopThumbEventPropagation}
                    onTouchStart={stopThumbEventPropagation}
                    onPointerDown={stopThumbEventPropagation}
                    className={cn(
                      "relative h-[72px] w-[72px] sm:h-20 sm:w-20 overflow-hidden border bg-white cursor-pointer transition-all duration-300",
                      selected ? "border-black" : "border-[#D9D9D9]",
                      // Dim images that don't match the current color/size selection
                      !img._isMatch && "opacity-40 grayscale",
                    )}
                    aria-label={`${t("productDetails.viewImage")} ${idx + 1}`}
                    aria-current={selected ? "true" : undefined}
                  >
                    <ImageWithFallback
                      src={img._src}
                      alt={t("productDetails.thumbnail")}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {showThumbArrows ? (
            <>
              {canScrollThumbPrev ? (
                <CarouselPrevious
                  className={cn(
                    "transition-all duration-200 ease-out",
                    isMobile
                      ? "left-2 top-1/2 -translate-y-1/2"
                      : "top-2 left-1/2 -translate-x-1/2",
                  )}
                />
              ) : null}
              {canScrollThumbNext ? (
                <CarouselNext
                  className={cn(
                    "transition-all duration-200 ease-out",
                    isMobile
                      ? "right-2 top-1/2 -translate-y-1/2"
                      : "bottom-2 left-1/2 -translate-x-1/2",
                  )}
                />
              ) : null}
            </>
          ) : null}
        </Carousel>
      </div>

      <div className={cn("order-1 w-full", isMobile ? "order-1" : "order-2",)} >
        <div
          ref={containerRef}
          className={cn(
            "relative aspect-square w-full overflow-hidden border border-[#F1F1F1] bg-white transition-all duration-300",
            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in",
            // Dim main image when it doesn't match the current SKU filter
            active && !active._isMatch && "opacity-50 grayscale",
          )}
          onMouseEnter={() => !isMobile && imageSrc && setIsMagnifierVisible(true)}
          onMouseLeave={() => !isMobile && setIsMagnifierVisible(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => !isMobile && setIsMagnifierVisible(false)}
          onClick={() => {
            if (!imageSrc) return;
            setIsZoomed((prev) => !prev);
          }}
        >
          {active ?
            (<ImageWithFallback
              key={active._key}
              src={imageSrc}
              alt={t("productDetails.galleryImage")}
              fill
              preload
              className={cn(
                "object-contain transition-transform duration-150",
                isZoomed ? "scale-[1]" : "scale-[1]",
              )}
              style={
                !isMobile && isZoomed
                  ? {
                    transform: `scale(${zoomScale})`,
                    transformOrigin: `${magnifierPos.originX}% ${magnifierPos.originY}%`,
                  }
                  : undefined
              }
              onLoadingComplete={(img) => {
                setImageNatural({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              sizes="(max-width: 500px) 100vw, (max-width: 1024px) 100vw, 680px" />)
            : null
          }
          {!isMobile && isMagnifierVisible && !isZoomed && imageSrc ? (
            <div
              className="pointer-events-none absolute z-10 rounded-full border border-black/10 shadow-md"
              style={{
                width: magnifierSize,
                height: magnifierSize,
                left: magnifierPos.x - magnifierSize / 2,
                top: magnifierPos.y - magnifierSize / 2,
                backgroundImage: `url(${imageSrc})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: imageNatural
                  ? `${imageNatural.width * zoom}px ${imageNatural.height * zoom}px`
                  : `${zoom * 100}% ${zoom * 100}%`,
                backgroundPosition: `-${magnifierPos.bgX}px -${magnifierPos.bgY}px`,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
