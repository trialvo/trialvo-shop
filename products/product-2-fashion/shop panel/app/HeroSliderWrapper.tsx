"use client";

import HeroSlider, { type HeroSlide } from "@/components/sliders/HeroSlider";
import { useBanner } from "@/hooks/useBanner";
import { toPublicUrl } from "@/lib/utils";
import React from "react";

const HeroSliderWrapper: React.FC = () => {
  const { banners, bannersLoading } = useBanner({ featured: true });

  const slides: HeroSlide[] = React.useMemo(() => {
    if (!banners?.length) return [];

    return banners
      .map((b) => {
        const bg = toPublicUrl(b.img_path);
        if (!bg) return null;

        return {
          id: String(b.id),
          bg,
          cta: {
            label: b.title?.trim() ? b.title : "Shop Now",
            href: b.path?.trim() ? b.path : "/",
          },
        } satisfies HeroSlide;
      })
      .filter((x): x is HeroSlide => x !== null);
  }, [banners]);

  // Prefetch all banner images after data loads so subsequent slides appear instantly.
  // The first slide is already priority-loaded by HeroSlider; we preload the rest here.
  React.useEffect(() => {
    if (typeof window === "undefined" || slides.length <= 1) return;
    slides.slice(1).forEach((slide) => {
      const img = new window.Image();
      img.src = slide.bg;
    });
  }, [slides]);

  return (
    <HeroSlider
      slides={slides}
      isLoading={bannersLoading}
      autoplay={!bannersLoading && slides.length > 1}
      autoplayDelay={4000}
    />
  );
};

export default HeroSliderWrapper;
