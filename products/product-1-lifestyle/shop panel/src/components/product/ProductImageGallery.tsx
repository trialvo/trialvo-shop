"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type CSSProperties,
  type FC,
  type MouseEvent,
  type WheelEvent,
} from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_STYLES } from "@/lib/theme";

export interface ProductImageGalleryProps {
  images: string[];
  name: string;
  badge?: string | null;
  variant?: "vertical" | "overlay";
  className?: string;
}

type GalleryBaseProps = Pick<ProductImageGalleryProps, "images" | "name" | "badge">;
type OverlayGalleryProps = Pick<ProductImageGalleryProps, "images" | "name" | "badge" | "className">;
type Point = { x: number; y: number };
type TrackOffset = 0 | 1;
type SlideItem = { src: string; index: number };
type SliderControls = {
  selected: number;
  slideItems: SlideItem[];
  trackOffset: TrackOffset;
  animateTrack: boolean;
  prev: () => void;
  next: () => void;
  jumpTo: (index: number) => void;
  handleTransitionEnd: () => void;
};

const ZOOM_FACTOR = 2.5;
const LENS_SIZE   = 120;
const ZOOM_PREVIEW_GAP = 14;
const ZOOM_PREVIEW_MARGIN = 12;

function useGallerySlider(images: string[]): SliderControls {
  const hasMultipleImages = images.length > 1;
  const imageKey = images.join("\u0000");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [trackOffset, setTrackOffset] = useState<TrackOffset>(0);
  const [animateTrack, setAnimateTrack] = useState(false);

  const selected = targetIndex ?? currentIndex;
  const slideItems: SlideItem[] = targetIndex === null
    ? [{ src: images[currentIndex] ?? images[0] ?? "", index: currentIndex }]
    : [
      { src: images[currentIndex] ?? images[0] ?? "", index: currentIndex },
      { src: images[targetIndex] ?? images[0] ?? "", index: targetIndex },
    ];

  useEffect(() => {
    setAnimateTrack(false);
    setCurrentIndex(0);
    setTargetIndex(null);
    setTrackOffset(0);
  }, [imageKey]);

  const slideTo = useCallback((nextIndex: number) => {
    if (!hasMultipleImages) return;
    if (targetIndex !== null) return;
    if (nextIndex === currentIndex) return;

    setAnimateTrack(false);
    setTrackOffset(0);
    setTargetIndex(nextIndex);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimateTrack(true);
        setTrackOffset(1);
      });
    });
  }, [currentIndex, hasMultipleImages, targetIndex]);

  const prev = useCallback(() => {
    slideTo((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, slideTo]);

  const next = useCallback(() => {
    slideTo((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, slideTo]);

  const jumpTo = useCallback((index: number) => {
    slideTo(index);
  }, [slideTo]);

  const handleTransitionEnd = useCallback(() => {
    if (!hasMultipleImages) return;
    if (targetIndex === null) return;
    if (trackOffset !== 1) return;

    setAnimateTrack(false);
    setCurrentIndex(targetIndex);
    setTargetIndex(null);
    setTrackOffset(0);
  }, [hasMultipleImages, targetIndex, trackOffset]);

  return {
    selected,
    slideItems,
    trackOffset,
    animateTrack,
    prev,
    next,
    jumpTo,
    handleTransitionEnd,
  };
}

function useImageMagnifier(activeImage: string) {
  const [zooming, setZooming] = useState(false);
  const [lensPos, setLensPos] = useState<Point>({ x: 0, y: 0 });
  const [zoomBg,  setZoomBg]  = useState<Point>({ x: 50, y: 50 });
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    setZooming(true);
    setImgRect(rect);
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const half = LENS_SIZE / 2;
    const cx = Math.max(half, Math.min(rect.width  - half, rawX));
    const cy = Math.max(half, Math.min(rect.height - half, rawY));
    setLensPos({ x: cx - half, y: cy - half });
    setZoomBg({ x: (cx / rect.width) * 100, y: (cy / rect.height) * 100 });
  }, []);

  useEffect(() => {
    setZooming(false);
    setImgRect(null);
  }, [activeImage]);

  const startZoom = useCallback(() => setZooming(true), []);
  const stopZoom = useCallback(() => {
    setZooming(false);
    setImgRect(null);
  }, []);

  return {
    frameRef,
    zooming,
    lensPos,
    zoomBg,
    imgRect,
    startZoom,
    stopZoom,
    handleMouseMove,
  };
}

function toCssUrl(src: string): string {
  return `url(${JSON.stringify(src)})`;
}

function getZoomPreviewStyle(
  rect: DOMRect,
  imageSrc: string,
  zoomBg: Point,
): CSSProperties {
  const width = Math.min(rect.width * 0.85, 380);
  const height = Math.min(rect.height * 0.85, 380);
  const rightSideLeft = rect.right + ZOOM_PREVIEW_GAP;
  const fitsRight = rightSideLeft + width <= window.innerWidth - ZOOM_PREVIEW_MARGIN;
  const left = fitsRight
    ? rightSideLeft
    : Math.max(ZOOM_PREVIEW_MARGIN, rect.left - width - ZOOM_PREVIEW_GAP);
  const top = Math.max(
    ZOOM_PREVIEW_MARGIN,
    Math.min(rect.top, window.innerHeight - height - ZOOM_PREVIEW_MARGIN),
  );

  return {
    position: "fixed",
    left,
    top,
    width,
    height,
    zIndex: 9999,
    backgroundImage: toCssUrl(imageSrc),
    backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
    backgroundPosition: `${zoomBg.x}% ${zoomBg.y}%`,
    backgroundRepeat: "no-repeat",
    backgroundColor: "#f3f3f3",
  };
}

/* thumbnail sizing — single source of truth */
const THUMB_SIZE    = 76;                                     // px: square thumb
const THUMB_GAP     = 10;                                     // px: gap between thumbs
const THUMB_STEP    = THUMB_SIZE + THUMB_GAP;                 // px: one scroll step
const VISIBLE_MAX   = 5;                                      // max thumbs visible
const CLIP_H        = VISIBLE_MAX * THUMB_SIZE + (VISIBLE_MAX - 1) * THUMB_GAP; // exact clip height

/* ──────────────────────────────────────────────────────────────────────
   VerticalGallery — direct magnifier zoom + sliding thumbnails.
────────────────────────────────────────────────────────────────────── */
const VerticalGallery: FC<GalleryBaseProps> = ({
  images, name, badge,
}) => {
  const galleryImages = images.length ? images : [""];
  const hasMultipleImages = galleryImages.length > 1;
  const [hovered,  setHovered]  = useState(false);
  const {
    selected,
    slideItems,
    trackOffset,
    animateTrack,
    prev,
    next,
    jumpTo,
    handleTransitionEnd,
  } = useGallerySlider(galleryImages);
  const selectedImage = galleryImages[selected] ?? galleryImages[0] ?? "";
  const {
    frameRef,
    zooming,
    lensPos,
    zoomBg,
    imgRect,
    startZoom,
    stopZoom,
    handleMouseMove,
  } = useImageMagnifier(selectedImage);
  const [sliderControlHovered, setSliderControlHovered] = useState(false);
  const sliderControlHoveredRef = useRef(false);

  const updateSliderControlHover = useCallback((isHovered: boolean) => {
    sliderControlHoveredRef.current = isHovered;
    setSliderControlHovered(isHovered);
    if (isHovered) stopZoom();
  }, [stopZoom]);

  const handleGalleryMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (sliderControlHoveredRef.current) return;
    handleMouseMove(event);
  }, [handleMouseMove]);

  /* thumbnail smooth scroll */
  const [thumbTop,  setThumbTop] = useState(0);
  const maxOffset = Math.max(0, (galleryImages.length - VISIBLE_MAX) * THUMB_STEP);

  const scrollBy = useCallback((delta: number) => {
    setThumbTop((p) => Math.max(0, Math.min(maxOffset, p + delta)));
  }, [maxOffset]);

  /* keep selected thumb visible inside the clipping window */
  useEffect(() => {
    const itemTop    = selected * THUMB_STEP;           // top edge of selected thumb
    const itemBottom = itemTop + THUMB_SIZE;            // bottom edge of selected thumb
    setThumbTop((currentTop) => {
      if (itemTop < currentTop) return itemTop;          // scroll up so thumb top is visible
      if (itemBottom > currentTop + CLIP_H) return itemBottom - CLIP_H;
      return currentTop;
    });
  }, [selected]);

  const badgeKey = badge?.toUpperCase() ?? "";
  const canUp    = thumbTop > 0;
  const canDown  = thumbTop < maxOffset;
  const shouldShowMagnifier = zooming && !sliderControlHovered;
  const shouldShowZoomIndicator = hovered && !sliderControlHovered;
  const handleThumbnailWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;
    if (event.deltaY < 0 && !canUp) return;
    if (event.deltaY > 0 && !canDown) return;

    event.preventDefault();
    scrollBy(event.deltaY > 0 ? THUMB_STEP : -THUMB_STEP);
  }, [canDown, canUp, hasMultipleImages, scrollBy]);

  return (
    <>
      <div className="flex gap-4">

        {/* ══ Thumbnail strip (left) ══ */}
        {hasMultipleImages && (
          <div className="hidden sm:flex flex-col items-center w-[76px] shrink-0 relative">

            {/* Scroll UP button — sits above the strip */}
            <button
              type="button"
              onClick={() => scrollBy(-THUMB_STEP)}
              disabled={!canUp}
              aria-label="Scroll thumbnails up"
              className={cn(
                "w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 mb-2 transition-all duration-200",
                canUp
                  ? "opacity-100 cursor-pointer hover:shadow-md hover:border-gray-300"
                  : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronUp size={13} className="text-gray-500" />
            </button>

            {/* Clipping window — shows exactly VISIBLE_MAX thumbnails */}
            <div
              className="w-full overflow-hidden"
              style={{ height: CLIP_H }}
              onWheel={handleThumbnailWheel}
            >
              <div
                className="flex flex-col"
                style={{
                  gap: THUMB_GAP,
                  transform:  `translateY(-${thumbTop}px)`,
                  transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {galleryImages.map((img, i) => {
                  const isActive = i === selected;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => jumpTo(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-pressed={isActive}
                      style={{
                        width:         THUMB_SIZE,
                        height:        THUMB_SIZE,
                        flexShrink:    0,
                        overflow:      "hidden",
                        borderRadius:  6,
                        cursor:        "pointer",
                        border:        isActive
                          ? "1px solid #18181b"          /* active: 1px solid zinc-900 */
                          : "1px solid #e4e4e7",          /* inactive: 1px solid zinc-200 */
                        outline:       "none",
                        transition:    "border-color 0.15s ease, box-shadow 0.15s ease",
                        boxShadow:     isActive ? "0 1px 3px rgba(0,0,0,0.05)" : undefined,
                        padding:       0,
                        background:    "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#a1a1aa";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#e4e4e7";
                      }}
                    >
                      <img
                        src={img}
                        alt={`View ${i + 1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        loading="lazy"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scroll DOWN button — sits below the strip */}
            <button
              type="button"
              onClick={() => scrollBy(THUMB_STEP)}
              disabled={!canDown}
              aria-label="Scroll thumbnails down"
              className={cn(
                "w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 mt-2 transition-all duration-200",
                canDown
                  ? "opacity-100 cursor-pointer hover:shadow-md hover:border-gray-300"
                  : "opacity-0 pointer-events-none"
              )}
            >
              <ChevronDown size={13} className="text-gray-500" />
            </button>
          </div>
        )}


        {/* ══ Main image — direct magnifier zoom ══ */}
        <div
          ref={frameRef}
          className={cn(
            "flex-1 relative overflow-hidden select-none",
            shouldShowMagnifier ? "cursor-crosshair" : "cursor-zoom-in",
          )}
          style={{ backgroundColor: "#f3f3f3", aspectRatio: "1 / 1" }}
          onMouseEnter={() => {
            setHovered(true);
            startZoom();
          }}
          onMouseLeave={() => {
            setHovered(false);
            updateSliderControlHover(false);
            stopZoom();
          }}
          onMouseMove={handleGalleryMouseMove}
        >
          <div
            className={cn(
              "flex h-full will-change-transform",
              animateTrack && "transition-transform duration-500 ease-out",
            )}
            style={{ transform: `translateX(-${trackOffset * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slideItems.map((item, slideIndex) => (
              <div key={`${item.src}-${item.index}-${slideIndex}`} className="w-full h-full shrink-0">
                <img
                  src={item.src}
                  alt={slideIndex === trackOffset ? name : ""}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Zoom lens overlay */}
          {shouldShowMagnifier && imgRect && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left:   lensPos.x,
                top:    lensPos.y,
                width:  LENS_SIZE,
                height: LENS_SIZE,
                backgroundColor: "rgba(255,255,180,0.28)",
                border: "1px solid rgba(180,160,0,0.35)",
              }}
            />
          )}

          {/* Zoom preview panel */}
          {shouldShowMagnifier && imgRect && selectedImage && (
            <div
              className="pointer-events-none overflow-hidden shadow-2xl border border-gray-200"
              style={getZoomPreviewStyle(imgRect, selectedImage, zoomBg)}
            />
          )}

          {/* Badge */}
          {badge && (
            <span className={cn(
              "absolute top-3 left-3 z-10 text-[9px] tracking-[0.2em] uppercase font-bold px-2.5 py-1 rounded-full shadow-sm pointer-events-none",
              BADGE_STYLES[badgeKey] ?? "bg-accent text-accent-foreground"
            )}>
              {badge}
            </span>
          )}

          {/* Zoom-in hint icon — bottom right on hover */}
          <div className={cn(
            "absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 pointer-events-none",
            shouldShowZoomIndicator ? "opacity-100" : "opacity-0"
          )}>
            <ZoomIn size={14} className="text-white" />
          </div>

          {/* Prev / Next arrows on hover */}
          {hasMultipleImages && (
            <>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                onMouseEnter={() => updateSliderControlHover(true)}
                onMouseLeave={() => updateSliderControlHover(false)}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.22)] transition-all cursor-pointer active:scale-95",
                  hovered ? "opacity-100" : "opacity-0"
                )}
                aria-label="Previous">
                <ChevronLeft size={18} className="text-gray-700" />
              </button>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                onMouseEnter={() => updateSliderControlHover(true)}
                onMouseLeave={() => updateSliderControlHover(false)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.22)] transition-all cursor-pointer active:scale-95",
                  hovered ? "opacity-100" : "opacity-0"
                )}
                aria-label="Next">
                <ChevronRight size={18} className="text-gray-700" />
              </button>
            </>
          )}

          {/* Mobile dots */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1 sm:hidden">
              {galleryImages.map((_, i) => (
                <button key={i} type="button"
                  onClick={(e) => { e.stopPropagation(); jumpTo(i); }}
                  className={cn("h-1.5 rounded-full transition-all cursor-pointer",
                    i === selected ? "bg-foreground w-4" : "bg-muted-foreground w-1.5")} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   Overlay variant (QuickView)
────────────────────────────────────────────────────────────────────── */
const OverlayGallery: FC<OverlayGalleryProps> = ({ images, name, badge, className }) => {
  const badgeKey = badge?.toUpperCase() ?? "";
  const galleryImages = images.length ? images : [""];
  const hasMultipleImages = galleryImages.length > 1;
  const {
    selected,
    slideItems,
    trackOffset,
    animateTrack,
    prev,
    next,
    jumpTo,
    handleTransitionEnd,
  } = useGallerySlider(galleryImages);

  return (
    <div className={cn("relative bg-[#f3f3f3] aspect-square md:aspect-auto md:h-full overflow-hidden", className)}>
      <div
        className={cn(
          "flex h-full will-change-transform",
          animateTrack && "transition-transform duration-500 ease-out",
        )}
        style={{ transform: `translateX(-${trackOffset * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slideItems.map((item, slideIndex) => (
          <div key={`${item.src}-${item.index}-${slideIndex}`} className="w-full h-full shrink-0">
            <img src={item.src} alt={slideIndex === trackOffset ? name : ""} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {badge && (
        <span className={cn("absolute top-3 left-3 text-[9px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 rounded-full",
          BADGE_STYLES[badgeKey] ?? "bg-accent text-accent-foreground")}>
          {badge}
        </span>
      )}
      {hasMultipleImages && (
        <>
          <button type="button" onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95">
            <ChevronLeft size={15} className="text-gray-700" />
          </button>
          <button type="button" onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95">
            <ChevronRight size={15} className="text-gray-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => jumpTo(index)}
                aria-label={`View image ${index + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  index === selected ? "w-5 bg-foreground" : "w-1.5 bg-foreground/35 hover:bg-foreground/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   Export
────────────────────────────────────────────────────────────────────── */
export const ProductImageGallery: FC<ProductImageGalleryProps> = ({ images, name, badge, variant = "vertical", className }) => {
  if (variant === "overlay") return <OverlayGallery images={images} name={name} badge={badge} className={className} />;
  return (
    <div className={cn("w-full", className)}>
      <VerticalGallery images={images} name={name} badge={badge} />
    </div>
  );
};
