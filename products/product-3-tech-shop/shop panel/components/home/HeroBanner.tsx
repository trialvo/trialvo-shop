"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppButton } from '@/components/shared/AppButton';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";
import { useBanners } from "@/hooks/useBanners";
import { splitHeroBanners } from "@/lib/adapters/banner";

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const { banners, bannersLoading } = useBanners({
    zone: "Home Top",
    limit: 12,
  });

  const { slides, sideBanners } = useMemo(
    () => splitHeroBanners(banners),
    [banners],
  );

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(
      () => setCurrent((p) => (p + 1) % slides.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  if (bannersLoading) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        <div className="min-h-[220px] md:min-h-[350px] lg:min-h-[400px] rounded-sm bg-secondary animate-pulse" />
        <div className="hidden lg:flex flex-col gap-3">
          <div className="flex-1 min-h-[190px] rounded-sm bg-secondary animate-pulse" />
          <div className="flex-1 min-h-[190px] rounded-sm bg-secondary animate-pulse" />
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[Math.min(current, slides.length - 1)];
  if (!slide) return null;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
      <div className="relative overflow-hidden rounded-sm min-h-[220px] md:min-h-[350px] lg:min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={slide.image}
            alt={slide.title.replace(/\n/g, " ")}
            className="w-full h-full object-cover transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex items-center p-6 md:p-10 lg:p-14">
          <div className="max-w-lg">
            <h1 className="font-heading text-xl md:text-3xl lg:text-5xl font-bold text-white leading-tight whitespace-pre-line animate-fade-in">
              {slide.title}
            </h1>
            <p
              className="mt-2 text-white/70 text-xs md:text-sm animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              {slide.subtitle}
            </p>
            <div
              className="mt-4 flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <AppButton asChild size="sm" variant="accent" className="font-semibold px-6 md:text-sm md:px-8 md:py-2.5">
                <Link href={slide.link}>{slide.cta}</Link>
              </AppButton>
              <AppButton
                asChild
                variant="onDark"
                size="sm"
                className="md:text-sm md:px-6 md:py-2.5"
              >
                <Link href="/shop" className="inline-flex items-center gap-1.5">
                  View All
                  <RightArrowIcon className="h-3.5 w-3.5" />
                </Link>
              </AppButton>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-sm transition-all ${i === current ? "w-6 bg-accent" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() =>
                setCurrent((p) => (p - 1 + slides.length) % slides.length)
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-sm bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setCurrent((p) => (p + 1) % slides.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-sm bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="hidden lg:flex flex-col gap-3">
        {sideBanners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.link}
            className={`relative overflow-hidden rounded-sm flex-1 min-h-[190px] bg-gradient-to-br ${banner.bg} group`}
          >
            <div className="absolute inset-0 opacity-20">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="relative z-10 p-4 flex flex-col justify-end h-full">
              <h3 className="font-heading font-bold text-white text-base leading-tight">
                {banner.title}
              </h3>
              <p className="text-white/80 text-xs mt-1">{banner.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
