"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localize } from "@/lib/localize";
import type { AboutHeroContent } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type AboutHeroProps = {
  content: AboutHeroContent;
  language: MarketplaceLanguage;
};

/**
 * Standard about-page banner:
 * full-bleed photo background + readable overlay + short copy + CTAs.
 */
export function AboutHero({ content, language }: Readonly<AboutHeroProps>) {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="about-hero-heading"
    >
      {/* Background image plane */}
      <div className="absolute inset-0">
        <img
          src={content.image.src}
          alt={localize(content.image.alt, language)}
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Standard dark wash so white text stays readable */}
        <div
          className="absolute inset-0 bg-[linear-gradient(100deg,hsl(220_20%_8%/0.86)_0%,hsl(220_18%_10%/0.68)_48%,hsl(220_14%_12%/0.45)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,hsl(153_72%_40%/0.2),transparent_50%)]"
          aria-hidden="true"
        />
      </div>

      <div className="container-custom relative z-10 flex min-h-[280px] items-end py-12 md:min-h-[340px] md:items-center md:py-16">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {localize(content.eyebrow, language)}
          </p>
          <h1
            id="about-hero-heading"
            className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl"
          >
            {localize(content.title, language)}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            {localize(content.supporting, language)}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-10 rounded-lg bg-accent px-5 font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <LocalizedLink href="/products">
                {localize(content.primaryCta, language)}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </LocalizedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-lg border-white/35 bg-white/10 px-5 text-white backdrop-blur-sm hover:bg-white/18 hover:text-white"
            >
              <LocalizedLink href="/contact">
                {localize(content.secondaryCta, language)}
              </LocalizedLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutHero;
