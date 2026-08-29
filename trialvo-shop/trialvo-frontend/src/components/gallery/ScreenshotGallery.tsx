'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageGalleryModal from './ImageGalleryModal';
import { cn } from '@/lib/utils';

interface ScreenshotGalleryProps {
  images: string[];
  title?: string;
  className?: string;
}

interface ThumbRailProps {
  images: string[];
  index: number;
  orientation: 'vertical' | 'horizontal';
  onSelect: (index: number) => void;
}

const EDGE_TOLERANCE = 4;

/**
 * Thumbnail strip. Vertical rails are absolutely positioned so they take their
 * height from the grid row — that is what keeps the rail exactly as tall as the
 * main image instead of stretching the card past it.
 */
function ThumbRail({ images, index, orientation, onSelect }: Readonly<ThumbRailProps>) {
  const vertical = orientation === 'vertical';
  const listRef = useRef<HTMLUListElement>(null);
  const itemsRef = useRef<Array<HTMLLIElement | null>>([]);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const offset = vertical ? list.scrollTop : list.scrollLeft;
    const viewport = vertical ? list.clientHeight : list.clientWidth;
    const total = vertical ? list.scrollHeight : list.scrollWidth;

    setEdges({
      start: offset > EDGE_TOLERANCE,
      end: offset + viewport < total - EDGE_TOLERANCE,
    });
  }, [vertical]);

  // The rail height follows the image, which follows the column width, so the
  // overflow state has to be re-read whenever the layout changes.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    measure();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure, images.length]);

  // Keep the selected thumbnail in view when the arrows or keyboard change it.
  useEffect(() => {
    const list = listRef.current;
    const item = itemsRef.current[index];
    if (!list || !item) return;

    const start = vertical ? item.offsetTop : item.offsetLeft;
    const size = vertical ? item.offsetHeight : item.offsetWidth;
    const offset = vertical ? list.scrollTop : list.scrollLeft;
    const viewport = vertical ? list.clientHeight : list.clientWidth;

    let next: number | null = null;
    if (start < offset) next = start;
    else if (start + size > offset + viewport) next = start + size - viewport;
    if (next === null) return;

    list.scrollTo(
      vertical
        ? { top: next, behavior: 'smooth' }
        : { left: next, behavior: 'smooth' },
    );
  }, [index, vertical]);

  return (
    <>
      <ul
        ref={listRef}
        onScroll={measure}
        className={cn(
          'flex gap-2',
          vertical
            ? 'absolute inset-0 flex-col overflow-y-auto overflow-x-hidden pr-1'
            : 'overflow-x-auto pb-1',
        )}
      >
        {images.map((img, thumbIndex) => (
          <li
            key={`${img}-${thumbIndex}`}
            ref={(el) => {
              itemsRef.current[thumbIndex] = el;
            }}
            className={cn('shrink-0', vertical ? 'w-full' : 'w-[4.5rem]')}
          >
            <button
              type="button"
              onClick={() => onSelect(thumbIndex)}
              aria-label={`Screenshot ${thumbIndex + 1}`}
              aria-current={thumbIndex === index}
              className={cn(
                'block aspect-[16/10] w-full overflow-hidden rounded-md ring-1 ring-inset transition-all',
                thumbIndex === index
                  ? 'opacity-100 ring-2 ring-accent'
                  : 'opacity-60 ring-border hover:opacity-100',
              )}
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {edges.start ? (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute from-card to-transparent',
            vertical
              ? 'inset-x-0 top-0 h-6 bg-gradient-to-b'
              : 'inset-y-0 left-0 w-6 bg-gradient-to-r',
          )}
        />
      ) : null}
      {edges.end ? (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute from-card to-transparent',
            vertical
              ? 'inset-x-0 bottom-0 h-6 bg-gradient-to-t'
              : 'inset-y-0 right-0 w-6 bg-gradient-to-l',
          )}
        />
      ) : null}
    </>
  );
}

/**
 * Screenshot viewer. On wide screens the thumbnails sit in a rail beside the
 * image, which keeps the whole gallery short enough to pin in a sticky column;
 * on narrow screens they move below it as a horizontal strip.
 */
const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  images,
  title,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const total = images?.length ?? 0;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  if (!images || total === 0) return null;

  const hasMany = total > 1;
  const index = Math.min(currentIndex, total - 1);

  return (
    <>
      <div
        className={cn(
          hasMany && 'sm:grid sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-3',
          className,
        )}
      >
        {hasMany ? (
          <div className="relative hidden sm:block">
            <ThumbRail
              images={images}
              index={index}
              orientation="vertical"
              onSelect={setCurrentIndex}
            />
          </div>
        ) : null}

        <div className="group relative">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="relative block aspect-[16/10] w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted"
          >
            <img
              src={images[index]}
              alt={
                title
                  ? `${title} - Screenshot ${index + 1}`
                  : `Screenshot ${index + 1}`
              }
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
            <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 shadow-card backdrop-blur transition-opacity group-hover:opacity-100">
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </span>
            {hasMany ? (
              <span className="absolute bottom-3 right-3 rounded-md bg-foreground/75 px-2 py-0.5 text-[11px] font-medium tabular-nums text-background">
                {index + 1} / {total}
              </span>
            ) : null}
          </button>

          {hasMany ? (
            <>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Previous screenshot"
                className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-md opacity-0 shadow-card transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Next screenshot"
                className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-md opacity-0 shadow-card transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>

        {hasMany ? (
          <div className="relative mt-3 sm:hidden">
            <ThumbRail
              images={images}
              index={index}
              orientation="horizontal"
              onSelect={setCurrentIndex}
            />
          </div>
        ) : null}
      </div>

      <ImageGalleryModal
        images={images}
        currentIndex={index}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigate={setCurrentIndex}
        title={title}
      />
    </>
  );
};

export default ScreenshotGallery;
