"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/hooks/useTranslation";
import { ProductImage } from "@/lib/api/product/service";
import { cn, toPublicUrl } from "@/lib/utils";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiHeart } from "react-icons/fi";

type GalleryProduct = {
  id: number;
  is_favourite?: boolean;
};

type Props = {
  images: ProductImage[];
  /** When set, only images matching the selected SKU (color+size) OR shared images (sku_id=null) are shown */
  selectedColorId?: number;
  selectedVariantId?: number;
  /** Optional — enables the floating wishlist control on the main image */
  product?: GalleryProduct;
};

type GalleryImage = ProductImage & {
  _src: string;
  _key: string;
  /** True when this image matches the currently selected color/size filter */
  _isMatch: boolean;
};

const floatBtn =
  "grid h-10 w-10 place-items-center rounded-full border border-black/8 bg-white text-[#191919] shadow-[0_4px_16px_rgba(20,16,12,0.12)] transition-all duration-200 hover:scale-[1.04] active:scale-95";

const ProductGallery: React.FC<Props> = ({
  images,
  selectedColorId,
  selectedVariantId,
  product,
}) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const handleFavoriteClick = useHandleFavoriteClick();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsHoverRef = useRef(false);

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

  const safeImages = useMemo<GalleryImage[]>(() => {
    const hasSkuAssignments = allSafeImages.some((img) => img.sku_id != null);
    const anyFilter = !!(selectedColorId || selectedVariantId);

    const isMatchFn = (img: GalleryImage): boolean => {
      if (img.sku_id == null) return true;
      if (selectedColorId && img.sku_color_id !== selectedColorId) return false;
      if (
        selectedVariantId &&
        img.sku_variant_id != null &&
        img.sku_variant_id !== selectedVariantId
      ) {
        return false;
      }
      return true;
    };

    if (!hasSkuAssignments || !anyFilter) {
      return allSafeImages.map((img) => ({ ...img, _isMatch: true }));
    }

    const anyMatch = allSafeImages.some(isMatchFn);

    return allSafeImages.map((img) => ({
      ...img,
      _isMatch: anyMatch ? isMatchFn(img) : true,
    }));
  }, [allSafeImages, selectedColorId, selectedVariantId]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isFavourite, setIsFavourite] = useState(product?.is_favourite === true);
  const [isMainHovered, setIsMainHovered] = useState(false);
  const active = safeImages[activeIndex];
  const imageSrc = active?._src ?? "";
  const [thumbsApi, setThumbsApi] = useState<CarouselApi | null>(null);
  const [canScrollThumbPrev, setCanScrollThumbPrev] = useState(false);
  const [canScrollThumbNext, setCanScrollThumbNext] = useState(false);
  const [isMagnifierVisible, setIsMagnifierVisible] = useState(false);
  const [imageNatural, setImageNatural] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [magnifierPos, setMagnifierPos] = useState({
    x: 0,
    y: 0,
    bgX: 0,
    bgY: 0,
  });
  const magnifierSize = 200;
  const zoom = 1;
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

  const goToIndex = useCallback(
    (index: number) => {
      if (safeImages.length === 0) return;
      const next = ((index % safeImages.length) + safeImages.length) % safeImages.length;
      setActiveIndex(next);
      scrollThumbToIndex(next);
    },
    [safeImages.length, scrollThumbToIndex],
  );

  const setControlsHover = (hovering: boolean) => {
    controlsHoverRef.current = hovering;
    if (hovering) setIsMagnifierVisible(false);
  };

  const updateMagnifier = (x: number, y: number) => {
    if (isMobile || controlsHoverRef.current) {
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
    setIsMagnifierVisible(true);
    setMagnifierPos({ x: clampedX, y: clampedY, bgX, bgY });
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

  const showThumbArrows = useMemo(() => {
    const len = allSafeImages.length;
    return isMobile ? len > 4 : len >= 5;
  }, [isMobile, allSafeImages.length]);

  const hasMultiple = safeImages.length > 1;
  const showNavArrows = hasMultiple && (isMobile || isMainHovered);

  React.useEffect(() => {
    setIsFavourite(product?.is_favourite === true);
  }, [product?.id, product?.is_favourite]);

  React.useEffect(() => {
    if (safeImages.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, safeImages.length - 1));
  }, [safeImages.length]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [selectedColorId, selectedVariantId]);

  React.useEffect(() => {
    setIsMagnifierVisible(false);
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

  const thumbNavBtn =
    "absolute z-10 grid h-7 w-7 place-items-center rounded-full border border-black/8 bg-white text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.1)] transition-opacity hover:bg-[#FAFAFA]";

  return (
    <div
      className={cn(
        "flex gap-3 min-[768px]:gap-3",
        isMobile ? "flex-col col-span-12" : "flex-row items-stretch col-span-6",
      )}
    >
      {/* Thumbs — stretch to main gallery height on desktop */}
      <div
        className={cn(
          isMobile ? "order-2 w-full" : "order-1 relative w-16 shrink-0 self-stretch",
        )}
      >
        <Carousel
          orientation={isMobile ? "horizontal" : "vertical"}
          setApi={setThumbsApi}
          opts={{
            align: "start",
            axis: isMobile ? "x" : "y",
            containScroll: "trimSnaps",
            dragFree: false,
            watchDrag: true,
            duration: 22,
          }}
          className={cn(
            "relative w-full",
            !isMobile &&
              "absolute inset-0 h-full [&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]]:min-h-0",
          )}
        >
          <CarouselContent
            className={cn(
              isMobile
                ? "-ml-2 h-auto flex-row touch-pan-x"
                : "-mt-2 ml-0 h-full min-h-0 flex-col",
            )}
          >
            {safeImages.map((img, idx) => {
              const selected = idx === activeIndex;

              return (
                <CarouselItem
                  key={img._key}
                  className={cn(isMobile ? "basis-auto pl-2" : "basis-auto pt-2")}
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
                      "relative h-14 w-14 cursor-pointer overflow-hidden rounded-lg bg-[#F1F1F1] transition-[border-color,opacity] duration-200 ease-out",
                      selected
                        ? "border-2 border-[#191919]"
                        : "border border-black/10 hover:border-black/25",
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
                      sizes="56px"
                    />
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {showThumbArrows ? (
            <>
              {canScrollThumbPrev ? (
                <button
                  type="button"
                  aria-label="Previous thumbnails"
                  className={cn(
                    thumbNavBtn,
                    isMobile
                      ? "left-0.5 top-1/2 -translate-y-1/2"
                      : "left-1/2 top-0 -translate-x-1/2",
                  )}
                  onClick={() => thumbsApi?.scrollPrev()}
                >
                  {isMobile ? (
                    <FiChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <FiChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </button>
              ) : null}
              {canScrollThumbNext ? (
                <button
                  type="button"
                  aria-label="Next thumbnails"
                  className={cn(
                    thumbNavBtn,
                    isMobile
                      ? "right-0.5 top-1/2 -translate-y-1/2"
                      : "bottom-0 left-1/2 -translate-x-1/2",
                  )}
                  onClick={() => thumbsApi?.scrollNext()}
                >
                  {isMobile ? (
                    <FiChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </button>
              ) : null}
            </>
          ) : null}
        </Carousel>
      </div>

      {/* Main image */}
      <div className={cn("order-1 min-w-0 flex-1", isMobile ? "order-1" : "order-2")}>
        <div
          ref={containerRef}
          className={cn(
            "group/main relative aspect-square w-full overflow-hidden rounded-[20px] bg-[#F4F4F4] transition-opacity duration-300",
            active && !active._isMatch && "opacity-50 grayscale",
          )}
          onMouseEnter={() => {
            if (!isMobile) setIsMainHovered(true);
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              setIsMainHovered(false);
              setControlsHover(false);
              setIsMagnifierVisible(false);
            }
          }}
          onMouseMove={handleMouseMove}
        >
          {active ? (
            <ImageWithFallback
              key={active._key}
              src={imageSrc}
              alt={t("productDetails.galleryImage")}
              fill
              preload
              className="object-contain"
              onLoadingComplete={(img) => {
                setImageNatural({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              sizes="(max-width: 500px) 100vw, (max-width: 1024px) 100vw, 680px"
            />
          ) : null}

          {!isMobile && isMagnifierVisible && imageSrc ? (
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

          {/* Wishlist — top right */}
          {product?.id ? (
            <button
              type="button"
              aria-label={t("product.addToWishlist")}
              className={cn(floatBtn, "absolute right-3 top-3 z-20 min-[768px]:right-4 min-[768px]:top-4")}
              onMouseEnter={() => setControlsHover(true)}
              onMouseLeave={() => setControlsHover(false)}
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteClick({
                  id: product.id,
                  is_favourite: isFavourite,
                });
                setIsFavourite((prev) => !prev);
              }}
            >
              <FiHeart
                className={cn("h-[18px] w-[18px]", isFavourite && "fill-[#E52D2D] text-[#E52D2D]")}
                strokeWidth={1.75}
              />
            </button>
          ) : null}

          {/* Prev / next — visible on image hover (always on mobile) */}
          {hasMultiple ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className={cn(
                  floatBtn,
                  "absolute left-3 top-1/2 z-20 -translate-y-1/2 min-[768px]:left-4",
                  "transition-opacity duration-200",
                  showNavArrows ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                onMouseEnter={() => setControlsHover(true)}
                onMouseLeave={() => setControlsHover(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(activeIndex - 1);
                }}
              >
                <FiChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className={cn(
                  floatBtn,
                  "absolute right-3 top-1/2 z-20 -translate-y-1/2 min-[768px]:right-4",
                  "transition-opacity duration-200",
                  showNavArrows ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                onMouseEnter={() => setControlsHover(true)}
                onMouseLeave={() => setControlsHover(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(activeIndex + 1);
                }}
              >
                <FiChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
