"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media/url";
import { cn } from "@/lib/utils";

type GalleryImage = Readonly<{
  id: number;
  path: string;
  serial?: number;
  position?: number;
}>;

type CompareImageGalleryProps = Readonly<{
  images: GalleryImage[];
  name: string;
  className?: string;
}>;

/**
 * Standard product gallery for compare — crossfade main image + thumb strip.
 */
export function CompareImageGallery({
  images,
  name,
  className,
}: CompareImageGalleryProps): ReactElement {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const total = images.length;

  useEffect(() => {
    setActive(0);
  }, [images]);

  const goTo = useCallback(
    (index: number) => {
      if (total < 1) return;
      const next = ((index % total) + total) % total;
      if (next === active) return;
      setFading(true);
      window.setTimeout(() => {
        setActive(next);
        requestAnimationFrame(() => setFading(false));
      }, 140);
    },
    [active, total],
  );

  const src = images[active] ? resolveMediaUrl(images[active].path) : null;

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="group relative aspect-square w-full overflow-hidden rounded-sm border border-border bg-secondary/30 shadow-product">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={images[active]?.id ?? active}
            src={src}
            alt={`${name} — image ${active + 1}`}
            className={cn(
              "absolute inset-0 h-full w-full object-contain p-4 transition-all duration-300 ease-out",
              fading ? "scale-[0.98] opacity-0" : "scale-100 opacity-100",
            )}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => goTo(active - 1)}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm border border-border bg-card/90 text-foreground opacity-0 shadow-product backdrop-blur-sm transition hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => goTo(active + 1)}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm border border-border bg-card/90 text-foreground opacity-0 shadow-product backdrop-blur-sm transition hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="absolute bottom-2 right-2 rounded-sm bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background backdrop-blur-sm">
              {active + 1} / {total}
            </span>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hidden">
          {images.slice(0, 10).map((img, i) => {
            const thumb = resolveMediaUrl(img.path);
            const isActive = i === active;
            return (
              <button
                key={img.id}
                type="button"
                aria-label={`View image ${i + 1}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border-2 bg-secondary/30 transition-all duration-200",
                  isActive
                    ? "border-primary shadow-product"
                    : "border-border opacity-70 hover:opacity-100",
                )}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain p-0.5"
                    loading="lazy"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default CompareImageGallery;
