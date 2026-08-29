"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/section";
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
          className="absolute inset-0 bg-[linear-gradient(100deg,hsl(220_20%_8%/0.9)_0%,hsl(220_18%_10%/0.72)_48%,hsl(220_14%_12%/0.45)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,hsl(153_72%_40%/0.24),transparent_50%)]"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="pattern-grid absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_25%_50%,black,transparent_72%)]"
        />
        {/* Melt the photo into the next band instead of a hard cut. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
        />
      </div>

      <div className="container-custom relative z-10 flex min-h-[320px] items-end py-14 md:min-h-[400px] md:items-center md:py-20">
        <div className="max-w-2xl">
          {/* The scrim is dark in both themes, so the label is pinned to white
              rather than a theme token that would invert and disappear. */}
          <Eyebrow className="mb-4 text-white/70">
            {localize(content.eyebrow, language)}
          </Eyebrow>
          <h1
            id="about-hero-heading"
            className="font-display text-[2.125rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            {localize(content.title, language)}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/75 md:text-base md:leading-[1.75]">
            {localize(content.supporting, language)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 rounded-lg bg-accent px-6 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
            >
              <LocalizedLink href="/products">
                {localize(content.primaryCta, language)}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </LocalizedLink>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg border-white/25 bg-white/[0.07] px-6 text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/15 hover:text-white"
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
