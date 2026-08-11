import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductCardFeatureItem } from "@/types/productCard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 3;
const AUTO_MS = 4000;
const SWIPE_PX = 40;

export type ProductCardFeaturesProps = {
  features: ProductCardFeatureItem[];
};

function chunkFeatures(features: ProductCardFeatureItem[]) {
  const pages: ProductCardFeatureItem[][] = [];
  for (let i = 0; i < features.length; i += PAGE_SIZE) {
    pages.push(features.slice(i, i + PAGE_SIZE));
  }
  return pages;
}

/** Feature strip — smooth horizontal slide, autoplay, arrows, finger swipe. */
export function ProductCardFeatures({
  features,
}: Readonly<ProductCardFeaturesProps>) {
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

  const pages = chunkFeatures(features);
  const pageCount = Math.max(1, pages.length);
  const canSlide = pageCount > 1;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [features.length]);

  useEffect(() => {
    setPage(0);
    setDragPx(0);
  }, [features.length]);

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
        // Loop restart: snap without long reverse slide
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

  if (features.length === 0) return null;

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

  const goPrev = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    goTo(safePage - 1);
  };

  const goNext = (e?: MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
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
      className="relative border-y border-border py-3"
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
      {canSlide ? (
        <button
          type="button"
          onClick={goPrev}
          className={cn(
            "absolute left-0 top-1/2 z-10 -translate-y-1/2",
            "flex h-7 w-7 items-center justify-center rounded-full",
            "border border-border bg-card/95 text-muted-foreground shadow-sm",
            "transition-colors hover:border-accent/40 hover:text-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Previous features"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}

      <div className={cn(canSlide ? "px-8" : "px-0")}>
        <div
          ref={viewportRef}
          className="overflow-hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{ touchAction: canSlide ? "pan-y" : undefined }}
        >
          <div
            className={cn(
              "flex will-change-transform",
              !dragging &&
                !skipTransition &&
                !reduceMotion.current &&
                "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            )}
            style={{
              transform: `translate3d(${offsetX}px, 0, 0)`,
            }}
            aria-live="polite"
          >
            {pages.map((pageItems, pageIndex) => (
              <ul
                key={`feature-page-${pageIndex}`}
                className={cn(
                  "grid shrink-0 gap-2",
                  pageItems.length === 1 && "grid-cols-1",
                  pageItems.length === 2 && "grid-cols-2",
                  pageItems.length >= 3 && "grid-cols-3",
                )}
                style={{ width: viewportW > 0 ? viewportW : "100%" }}
                aria-hidden={pageIndex !== safePage}
              >
                {pageItems.map((feature) => (
                  <li
                    key={feature.id}
                    className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                  >
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-accent"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span className="line-clamp-2 text-[11px] font-medium leading-tight text-accent/90">
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      {canSlide ? (
        <button
          type="button"
          onClick={goNext}
          className={cn(
            "absolute right-0 top-1/2 z-10 -translate-y-1/2",
            "flex h-7 w-7 items-center justify-center rounded-full",
            "border border-border bg-card/95 text-muted-foreground shadow-sm",
            "transition-colors hover:border-accent/40 hover:text-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label="Next features"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}

      {canSlide ? (
        <div
          className="mt-2 flex items-center justify-center gap-1"
          aria-hidden="true"
        >
          {Array.from({ length: pageCount }, (_, i) => (
            <span
              key={`dot-${i}`}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === safePage ? "w-3 bg-accent" : "w-1 bg-border",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ProductCardFeatures;
