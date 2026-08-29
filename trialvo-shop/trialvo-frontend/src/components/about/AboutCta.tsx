"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/section";
import { localize } from "@/lib/localize";
import type { AboutCtaContent } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type AboutCtaProps = {
  content: AboutCtaContent;
  language: MarketplaceLanguage;
};

/** Closing CTA — same pattern as marketplace catalog CTA */
export function AboutCta({ content, language }: Readonly<AboutCtaProps>) {
  return (
    <Section tone="muted" size="sm" divider="top" className="py-12 md:py-16">
      <div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground shadow-soft-xl md:px-12 md:py-12">
        {/* Accent bloom and grid give the closing panel presence without
            competing with the button for attention. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_85%_15%,hsl(153_72%_45%/0.32),transparent_65%)]"
        />
        <div
          aria-hidden="true"
          className="pattern-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_20%_50%,black,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/25 to-transparent"
        />

        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center md:gap-8">
          <div className="max-w-xl">
            <h2 className="font-display text-[1.625rem] font-bold leading-[1.16] tracking-tight md:text-[2rem]">
              {localize(content.title, language)}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-primary-foreground/70">
              {localize(content.supporting, language)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
              className="h-11 rounded-lg border-primary-foreground/25 bg-primary-foreground/[0.06] px-6 text-primary-foreground hover:border-primary-foreground/40 hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <LocalizedLink href="/contact">
                {localize(content.secondaryCta, language)}
              </LocalizedLink>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default AboutCta;
