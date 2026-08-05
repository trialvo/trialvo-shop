"use client";

import SafeImage from "@/components/ui/SafeImage";
import { IMAGE_URL } from "@/config/env";
import { useBanner } from "@/hooks/useBanner";
import { useProduct } from "@/hooks/useProducts";
import type { ProductListItem } from "@/lib/api/product/service";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BADGE_STYLES } from "@/lib/theme";



const BannerSlider = () => {
  const [current, setCurrent]   = useState<number>(0);
  const [animating, setAnimating] = useState<boolean>(false);
  const { banners: apiBanners, bannersLoading } = useBanner();
  const { products: featuredProducts } = useProduct({ limit: 4, featured: true });

  /* ── Main slides from API banners ── */
  const mainSlides = useMemo(() => {
    if (!apiBanners || apiBanners.length === 0) return [];
    return apiBanners.slice(0, 6).map(b => ({
      image: b.img_path ? `${IMAGE_URL}${b.img_path}` : "",
      tag: b.zone || "Featured",
      title: b.title || "Shop Now",
      subtitle: b.subtitle || "Discover our latest collection",
      cta: "Shop Now",
      ctaHref: b.path || b.link || "/shop",
      align: "left" as const,
    }));
  }, [apiBanners]);

  /* ── Side cards from featured products ── */
  const sideCards = useMemo(() => {
    if (!featuredProducts || featuredProducts.length === 0) return [];
    return featuredProducts.slice(0, 4).map((p: ProductListItem) => {
      const img = `${IMAGE_URL}${p.thumbnail}` || (p.images?.[0]?.path ? `${IMAGE_URL}${p.images[0].path}` : "");
      return {
        image: img,
        title: p.name,
        label: p.featured ? "NEW" : p.best_deal ? "SALE" : "TRENDING",
        href: `/product/${p.slug}`,
      };
    });
  }, [featuredProducts]);

  useEffect(() => {
    if (mainSlides.length <= 1) return;
    const timer = setInterval(() => goTo(1), 5500);
    return () => clearInterval(timer);
  }, [current, mainSlides.length]);

  const goTo = (dir: number) => {
    if (animating || mainSlides.length === 0) return;
    setAnimating(true);
    setCurrent((prev) => (prev + dir + mainSlides.length) % mainSlides.length);
    setTimeout(() => setAnimating(false), 700);
  };

  /* Loading skeleton */
  if (bannersLoading || mainSlides.length === 0) {
    return (
      <section className="w-full bg-secondary/30">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-2 lg:pt-5 lg:pb-3">
          <div className="flex gap-2 lg:gap-4">
            <div className="flex-1 min-h-[200px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[420px] bg-secondary/60 animate-pulse rounded-sm" />
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2.5 w-[340px] xl:w-[400px] 2xl:w-[440px] shrink-0">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="bg-secondary/60 animate-pulse rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-2 lg:pt-5 lg:pb-3">
        <div className="flex gap-2 lg:gap-4">

          {/* ── Main slider ── */}
          <div className="flex-1 relative overflow-hidden group min-h-[200px] sm:min-h-[280px] md:min-h-[340px] lg:min-h-[420px] shadow-sm">
            {mainSlides.map((s, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <SafeImage src={s.image} alt={s.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/65 via-foreground/25 to-transparent" />

                {/* Content — compact on mobile, full on desktop */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-7 md:p-10 lg:p-14">
                  <span className="inline-block text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-semibold text-accent mb-1 sm:mb-2 drop-shadow">
                    {s.tag}
                  </span>
                  <h2 className="font-display text-xl sm:text-3xl md:text-4xl lg:text-[3.5rem] font-bold text-background tracking-wide uppercase mb-1 sm:mb-2 drop-shadow-lg leading-tight">
                    {s.title}
                  </h2>
                  <p className="hidden sm:block text-background/75 text-xs md:text-sm font-light tracking-wide max-w-sm mb-3 sm:mb-5 drop-shadow leading-relaxed">
                    {s.subtitle}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                      href={s.ctaHref}
                      className="inline-flex items-center gap-1.5 sm:gap-2 bg-accent hover:bg-accent/90 active:bg-accent/80 text-accent-foreground px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase font-semibold transition-all rounded-full shadow-lg hover:shadow-accent/30"
                    >
                      {s.cta} <ArrowRight size={10} className="sm:w-3 sm:h-3" />
                    </Link>
                    <Link
                      href="/shop"
                      className="hidden sm:inline text-background/70 hover:text-background text-[11px] tracking-[0.15em] uppercase font-medium transition-colors underline underline-offset-4"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Nav arrows — hidden on xs, show on sm+ hover */}
            <button
              onClick={() => goTo(-1)}
              className="hidden sm:flex absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </button>
            <button
              onClick={() => goTo(1)}
              className="hidden sm:flex absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight size={16} className="text-foreground" />
            </button>

            {/* Slide dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {mainSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current ? "bg-accent w-5 sm:w-6" : "bg-background/50 w-1.5 hover:bg-background/80"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Slide counter — hide on xs */}
            <div className="hidden sm:block absolute top-3 right-3 z-20 text-[11px] text-background/60 font-medium tracking-wide">
              {String(current + 1).padStart(2, "0")} / {String(mainSlides.length).padStart(2, "0")}
            </div>
          </div>

          {/* ── Side banner 2×2 grid — desktop only ── */}
          {sideCards.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2.5 w-[340px] xl:w-[400px] 2xl:w-[440px] shrink-0">
              {sideCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="relative overflow-hidden group/card cursor-pointer"
                >
                  <SafeImage
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
                  {card.label && (
                    <span className={`absolute top-2.5 left-2.5 text-[9px] tracking-[0.15em] uppercase font-bold px-2 py-0.5 rounded-full ${BADGE_STYLES[card.label] ?? "bg-accent text-accent-foreground"}`}>
                      {card.label}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 p-3 flex items-end justify-between w-full">
                    <p className="text-background text-xs font-semibold tracking-wide leading-tight truncate mr-2">{card.title}</p>
                    <ArrowRight size={13} className="text-background/50 group-hover/card:text-accent transition-all duration-200 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default BannerSlider;
