import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageGalleryModal from './ImageGalleryModal';
import { cn } from '@/lib/utils';

interface ScreenshotGalleryProps {
  images: string[];
  title?: string;
  className?: string;
}

/**
 * Screenshot viewer with a thumbnail rail that sits beside the image on wide
 * screens. Keeping the rail vertical means the whole gallery stays short
 * enough to pin in a sticky column instead of scrolling out of view.
 */
const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  images,
  title,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!images || images.length === 0) return null;

  const hasMany = images.length > 1;
  const index = Math.min(currentIndex, images.length - 1);

  return (
    <>
      <div
        className={cn(
          hasMany && 'sm:grid sm:grid-cols-[4.25rem_minmax(0,1fr)] sm:gap-3',
          className,
        )}
      >
        {hasMany ? (
          <ul className="order-2 mt-3 flex gap-2 overflow-x-auto pb-1 sm:order-none sm:mt-0 sm:max-h-[26rem] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0 sm:pr-1">
            {images.map((img, thumbIndex) => (
              <li key={`${img}-${thumbIndex}`} className="shrink-0 sm:w-full">
                <button
                  type="button"
                  onClick={() => setCurrentIndex(thumbIndex)}
                  aria-label={`Screenshot ${thumbIndex + 1}`}
                  aria-current={thumbIndex === index}
                  className={cn(
                    'block h-14 w-20 overflow-hidden rounded-md ring-1 ring-inset transition-all sm:w-full',
                    thumbIndex === index
                      ? 'opacity-100 ring-2 ring-accent'
                      : 'opacity-60 ring-border hover:opacity-100',
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
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
                {index + 1} / {images.length}
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
