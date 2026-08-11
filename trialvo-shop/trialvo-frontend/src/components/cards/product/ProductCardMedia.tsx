import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ProductCardBadges } from "@/components/cards/product/ProductCardBadges";
import type { ProductBadge } from "@/lib/digitalGoods";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

const AUTO_MS = 4500;
const SWIPE_PX = 40;

export type ProductCardMediaProps = {
  images: string[];
  imageAlt: string;
  badges: ProductBadge[];
  language: MarketplaceLanguage;
  showPlay?: boolean;
};

/** Top media — smooth image slider (auto, arrows, finger swipe). */
export function ProductCardMedia({
  images,
  imageAlt,
  badges,
  language,
  showPlay = false,
}: Readonly<ProductCardMediaProps>) {
  const slides = images.map((src) => resolveMediaUrl(src)).filter(Boolean);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewportW, setViewportW] = useState(0);
  const [skipTransition, setSkipTransition] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const swipedRef = useRef(false);
  const reduceMotion = useRef(false);

  const pageCount = Math.max(1, slides.length);
  const canSlide = slides.length > 1;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slides.length]);

  useEffect(() => {
    setPage(0);
    setDragPx(0);
  }, [slides.length]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = mq.matches;
    const onChange = () => {
      reduceMotion.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!canSlide || paused || reduceMotion.current || dragging) return;
    const id = window.setInterval(() => {
      setPage((p) => {
        const next = (p + 1) % pageCount;
        if (next === 0 && p === pageCount - 1) {
          setSkipTransition(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setSkipTransition(false));
          });
        }
        return next;
      });
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [canSlide, paused, pageCount, page, dragging]);

  const safePage = Math.min(page, pageCount - 1);

  const goTo = (next: number) => {
    const normalized = ((next % pageCount) + pageCount) % pageCount;
    const wraps =
      (safePage === pageCount - 1 && normalized === 0) ||
      (safePage === 0 && normalized === pageCount - 1);
    setDragPx(0);
    if (wraps) {
      setSkipTransition(true);
      setPage(normalized);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSkipTransition(false));
      });
      return;
    }
    setPage(normalized);
  };

  const goPrev = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(safePage - 1);
  };

  const goNext = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(safePage + 1);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!canSlide || e.pointerType === "mouse") return;
    pointerStartX.current = e.clientX;
    swipedRef.current = false;
    setDragging(true);
    setPaused(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerStartX.current == null) return;
    setDragPx(e.clientX - pointerStartX.current);
  };

  const finishDrag = (clientX: number) => {
    if (pointerStartX.current == null) {
      setDragging(false);
      setPaused(false);
      setDragPx(0);
      return false;
    }
    const delta = clientX - pointerStartX.current;
    pointerStartX.current = null;
    setDragging(false);
    setPaused(false);
    if (Math.abs(delta) < SWIPE_PX) {
      setDragPx(0);
      return false;
    }
    swipedRef.current = true;
    setDragPx(0);
    if (delta < 0) goTo(safePage + 1);
    else goTo(safePage - 1);
    return true;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (finishDrag(e.clientX)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
    setDragging(false);
    setPaused(false);
    setDragPx(0);
  };

  const blockLinkAfterSwipe = (e: MouseEvent) => {
    if (!swipedRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    swipedRef.current = false;
  };

  const offsetX = viewportW > 0 ? -(safePage * viewportW) + dragPx : 0;

  return (
    <div
      className="relative aspect-[16/10] overflow-hidden bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onClickCapture={blockLinkAfterSwipe}
    >
      <div
        ref={viewportRef}
        className="absolute inset-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{ touchAction: canSlide ? "pan-y" : undefined }}
      >
        {slides.length > 0 ? (
          <div
            className={cn(
              "flex h-full will-change-transform",
              !dragging &&
                !skipTransition &&
                !reduceMotion.current &&
                "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            )}
            style={{ transform: `translate3d(${offsetX}px, 0, 0)` }}
            aria-live="polite"
          >
            {slides.map((src, index) => (
              <div
                key={`slide-${index}-${src}`}
                className="h-full shrink-0"
                style={{ width: viewportW > 0 ? viewportW : "100%" }}
                aria-hidden={index !== safePage}
              >
                <img
                  src={src}
                  alt={index === safePage ? imageAlt : ""}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  draggable={false}
                  itemProp={index === 0 ? "image" : undefined}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            {language === "bn" ? "ছবি নেই" : "No image"}
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"
        aria-hidden="true"
      />

      {canSlide ? (
        <button
          type="button"
          onClick={goPrev}
          className={cn(
            "absolute left-2 top-1/2 z-10 -translate-y-1/2",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "border border-white/25 bg-black/35 text-white backdrop-blur-sm",
            "opacity-90 transition-opacity hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}

      {canSlide ? (
        <button
          type="button"
          onClick={goNext}
          className={cn(
            "absolute right-2 top-1/2 z-10 -translate-y-1/2",
            "flex h-8 w-8 items-center justify-center rounded-full",
            "border border-white/25 bg-black/35 text-white backdrop-blur-sm",
            "opacity-90 transition-opacity hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Next image"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}

      {canSlide ? (
        <div
          className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5"
          aria-hidden="true"
        >
          {slides.map((_, i) => (
            <span
              key={`img-dot-${i}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === safePage ? "w-4 bg-white" : "w-1.5 bg-white/45",
              )}
            />
          ))}
        </div>
      ) : null}

      <ProductCardBadges
        badges={badges}
        language={language}
        placement="overlay"
      />

      {showPlay ? (
        <span
          className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-accent shadow-md backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </span>
      ) : null}
    </div>
  );
}

export default ProductCardMedia;
