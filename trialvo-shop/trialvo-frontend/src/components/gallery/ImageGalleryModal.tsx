'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryModalProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  title?: string;
}

const CONTROL =
  'inline-flex items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

const SWIPE_THRESHOLD = 48;

/**
 * Full-screen screenshot viewer.
 *
 * Rendered into `document.body` through a portal. The gallery that opens this
 * lives inside a `position: sticky` column, and a sticky element creates its
 * own stacking context — inside it, no z-index can lift a `fixed` overlay
 * above the rest of the page. Escaping to the body is the only reliable fix.
 */
const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  title,
}) => {
  const [mounted, setMounted] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const hasMany = images.length > 1;

  const handlePrev = useCallback(() => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => setMounted(true), []);

  // A new image always starts fitted to the screen.
  useEffect(() => {
    setZoomed(false);
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Lock the page behind the viewer. The scrollbar width is paid back as
  // padding so the fixed navbar underneath does not jump sideways.
  useEffect(() => {
    if (!isOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement as HTMLElement | null;
    containerRef.current?.focus();

    return () => opener?.focus?.();
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null || zoomed || !hasMany) return;

    const delta = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    if (delta < 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  if (!mounted) return null;

  const label = title ? `${title} — screenshots` : 'Screenshot viewer';

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="image-gallery-viewer"
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] flex flex-col bg-black/95 outline-none backdrop-blur-sm"
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <header
            className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="min-w-0 truncate text-xs font-medium text-white/70">
              {hasMany ? (
                <span className="tabular-nums">
                  {currentIndex + 1} / {images.length}
                </span>
              ) : (
                title
              )}
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={zoomed ? 'Fit to screen' : 'Zoom to full size'}
                aria-pressed={zoomed}
                className={cn(CONTROL, 'h-10 w-10')}
                onClick={() => setZoomed((value) => !value)}
              >
                {zoomed ? (
                  <ZoomOut className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ZoomIn className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label="Close viewer"
                className={cn(CONTROL, 'h-10 w-10')}
                onClick={onClose}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            className={cn(
              'flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20',
              zoomed && 'overflow-auto',
            )}
          >
            <motion.img
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt={
                title
                  ? `${title} - Screenshot ${currentIndex + 1}`
                  : `Screenshot ${currentIndex + 1}`
              }
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'rounded-lg shadow-2xl',
                zoomed
                  ? 'max-w-none cursor-zoom-out'
                  : 'max-h-full max-w-full cursor-zoom-in object-contain',
              )}
              onClick={(e) => {
                e.stopPropagation();
                setZoomed((value) => !value);
              }}
            />
          </div>

          {hasMany ? (
            <>
              <button
                type="button"
                aria-label="Previous screenshot"
                className={cn(
                  CONTROL,
                  'absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:inline-flex',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next screenshot"
                className={cn(
                  CONTROL,
                  'absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:inline-flex',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>

              <div
                className="shrink-0 px-4 pb-4 pt-3 sm:px-6"
                onClick={(e) => e.stopPropagation()}
              >
                <ul className="mx-auto flex max-w-full justify-start gap-2 overflow-x-auto sm:justify-center">
                  {images.map((img, index) => (
                    <li key={`${img}-${index}`} className="shrink-0">
                      <button
                        type="button"
                        aria-label={`Screenshot ${index + 1}`}
                        aria-current={index === currentIndex}
                        className={cn(
                          'block h-12 w-16 overflow-hidden rounded-md ring-1 ring-inset transition-all',
                          index === currentIndex
                            ? 'opacity-100 ring-2 ring-white'
                            : 'opacity-50 ring-white/25 hover:opacity-100',
                        )}
                        onClick={() => onNavigate(index)}
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

export default ImageGalleryModal;
