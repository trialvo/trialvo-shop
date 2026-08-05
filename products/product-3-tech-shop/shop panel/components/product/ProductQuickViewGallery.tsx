"use client";

import { useEffect, useState, type ReactElement } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type ProductQuickViewGalleryProps = Readonly<{
  images: string[];
  title: string;
}>;

/**
 * Smooth Embla image slider for Quick View — arrows + dot indicators.
 */
export function ProductQuickViewGallery({
  images,
  title,
}: ProductQuickViewGalleryProps): ReactElement {
  const slides = images.length > 0 ? images : ["/placeholder.jpg"];
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    api?.scrollTo(0);
    setIndex(0);
  }, [api, slides.join("|")]);

  return (
    <div className="relative space-y-2">
      <Carousel
        setApi={setApi}
        opts={{ loop: slides.length > 1, align: "start", duration: 25 }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {slides.map((src, i) => (
            <CarouselItem key={`${src}-${i}`} className="pl-0 basis-full">
              <div className="relative aspect-square overflow-hidden rounded-sm bg-secondary/40 border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${title} — image ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className={cn(
                "absolute left-2 top-1/2 z-10 -translate-y-1/2",
                "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
                "border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-sm",
                "hover:bg-card disabled:opacity-40",
              )}
              onClick={() => api?.scrollPrev()}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next image"
              className={cn(
                "absolute right-2 top-1/2 z-10 -translate-y-1/2",
                "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
                "border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-sm",
                "hover:bg-card disabled:opacity-40",
              )}
              onClick={() => api?.scrollNext()}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : null}
      </Carousel>

      {slides.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40",
              )}
              onClick={() => api?.scrollTo(i)}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
