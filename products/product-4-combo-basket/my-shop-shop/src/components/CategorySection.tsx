"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dn } from "@/utils/displayName";

interface Category {
  id: number;
  name: string;
  name_bn?: string | null;
  slug: string;
  icon?: string;
  color?: string;
  svg_icon?: string;
}

interface CategorySectionProps {
  categories: Category[];
}

// Show slider when more than this many categories
const SLIDER_THRESHOLD = 5;

function CategoryCard({ cat }: { cat: Category }) {
  const accentColor = cat.color || "#e91e63";
  return (
    <Link
      href={`/products?category=${cat.slug}`}
      className="shadow-card group hover:shadow-card-hover flex h-full flex-col items-center rounded-2xl bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1"
    >
      <div
        className="mb-3 flex h-14 w-14 flex-none items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
        style={{ background: `${accentColor}18`, color: accentColor }}
      >
        {cat.svg_icon ? (
          <span
            className="flex h-7 w-7 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
            style={{ color: accentColor }}
            dangerouslySetInnerHTML={{ __html: cat.svg_icon }}
          />
        ) : (
          <span className="text-2xl">{cat.icon || "🏷️"}</span>
        )}
      </div>
      <h3 className="text-xs font-semibold leading-tight text-[#0f172a] transition-colors group-hover:text-[#e91e63] sm:text-sm">
        {dn(cat)}
      </h3>
    </Link>
  );
}

export default function CategorySection({ categories }: CategorySectionProps) {
  const useSlider = categories.length > SLIDER_THRESHOLD;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ── Drag-to-scroll state ──────────────────────────────────────────────────
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const [grabbing, setGrabbing] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [categories, checkScroll]);

  const onArrow = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? el.clientWidth * 0.65 : -el.clientWidth * 0.65, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  // ── Mouse drag handlers ───────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    startScrollLeft.current = el.scrollLeft;
    setGrabbing(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.2; // 1.2x multiplier for feel
    el.scrollLeft = startScrollLeft.current - walk;
    checkScroll();
  };

  const onMouseUp = () => {
    isDragging.current = false;
    setGrabbing(false);
  };

  // ── Touch is handled natively by overflow-x-auto ─────────────────────────

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
            ক্যাটাগরি{" "}
            <span className="bg-gradient-to-r from-[#e91e63] to-[#9c27b0] bg-clip-text text-transparent">
              অনুযায়ী কিনুন
            </span>
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            স্কিনকেয়ার, মেকআপ, গিফট সহ আমাদের বিশেষ কালেকশন দেখুন
          </p>
          <div className="section-divider mt-5" />
        </div>

        {useSlider ? (
          /* ── SLIDER MODE: >5 categories ── */
          <div className="relative">

            {/* Prev button */}
            <button
              onClick={() => onArrow("left")}
              disabled={!canScrollLeft}
              aria-label="পূর্ববর্তী"
              className={`absolute -left-4 top-1/2 z-10 -translate-y-1/2
                flex h-10 w-10 items-center justify-center rounded-full
                border border-slate-100 bg-white shadow-lg
                transition-all duration-200 sm:-left-5
                ${canScrollLeft
                  ? "cursor-pointer text-[#e91e63] hover:bg-[#e91e63] hover:text-white"
                  : "cursor-default text-slate-200 opacity-0 pointer-events-none"
                }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Scroll track
                Visible cards:  mobile 2.3 / sm 3.3 / md 4.3 / lg 5
                cursor: grab → grabbing while dragging
            */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:gap-4"
              style={{
                scrollSnapType: "x mandatory",
                cursor: grabbing ? "grabbing" : "grab",
                userSelect: "none",
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="
                    w-[calc((100%-9px)/2.3)] flex-none
                    sm:w-[calc((100%-12px)/3.3)]
                    md:w-[calc((100%-16px)/4.3)]
                    lg:w-[calc((100%-16px)/5)]
                  "
                  style={{ scrollSnapAlign: "start" }}
                  // Prevent click from firing if we just dragged
                  onClick={(e) => {
                    if (Math.abs(scrollRef.current!.scrollLeft - startScrollLeft.current) > 5) {
                      e.preventDefault();
                    }
                  }}
                >
                  <CategoryCard cat={cat} />
                </div>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={() => onArrow("right")}
              disabled={!canScrollRight}
              aria-label="পরবর্তী"
              className={`absolute -right-4 top-1/2 z-10 -translate-y-1/2
                flex h-10 w-10 items-center justify-center rounded-full
                border border-slate-100 bg-white shadow-lg
                transition-all duration-200 sm:-right-5
                ${canScrollRight
                  ? "cursor-pointer text-[#e91e63] hover:bg-[#e91e63] hover:text-white"
                  : "cursor-default text-slate-200 opacity-0 pointer-events-none"
                }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          /* ── GRID MODE: ≤5 categories ── */
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="
                  w-[calc(50%-6px)]
                  sm:w-[calc(33.333%-12px)]
                  md:w-[calc(25%-12px)]
                  lg:w-[calc(20%-13px)]
                "
              >
                <CategoryCard cat={cat} />
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
