"use client";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductImage } from "@/lib/api/product/service";
import { cn, toPublicUrl } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import * as React from "react";

type Props = {
  images: ProductImage[];
  title: string;
  className?: string;
  heightClassName?: string;
  aspectClassName?: string;
  imageClassName?: string;
  sizes?: string;
};

const arrowBtn =
  "h-8 w-8 rounded-full border border-black/8 bg-white text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.1)] hover:bg-[#FAFAFA]";

const QuickAddGalleryCarousel: React.FC<Props> = ({
  images,
  title,
  className,
  heightClassName,
  aspectClassName = "aspect-[4/5]",
  imageClassName,
  sizes = "(max-width: 1024px) 90vw, 320px",
}) => {
  const list = Array.isArray(images) ? images : [];
  const showArrows = list.length > 1;
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!carouselApi) return;
    const update = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    update();
    carouselApi.on("select", update);
    carouselApi.on("reInit", update);
    return () => {
      carouselApi.off("select", update);
      carouselApi.off("reInit", update);
    };
  }, [carouselApi]);

  return (
    <div className={cn("relative w-full", className)}>
      <Carousel className="w-full" setApi={setCarouselApi}>
        <CarouselContent>
          {list.map((img, idx) => {
            const url = img?.path ? toPublicUrl(img.path) : null;
            const safeUrl = typeof url === "string" && url.trim().length > 0 ? url : null;

            return (
              <CarouselItem key={`${img?.id ?? "img"}-${idx}`}>
                <div
                  className={cn(
                    "relative w-full overflow-hidden rounded-md bg-[#F1F1F1]",
                    heightClassName ?? aspectClassName,
                  )}
                >
                  {safeUrl ? (
                    <ImageWithFallback
                      src={safeUrl}
                      alt={title}
                      fill
                      preload={idx === 0}
                      sizes={sizes}
                      className={cn("object-contain", imageClassName)}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {showArrows ? (
          <>
            {canScrollPrev ? (
              <CarouselPrevious className={cn("left-2", arrowBtn)} />
            ) : null}
            {canScrollNext ? (
              <CarouselNext className={cn("right-2", arrowBtn)} />
            ) : null}
          </>
        ) : null}
      </Carousel>
    </div>
  );
};

export default QuickAddGalleryCarousel;
