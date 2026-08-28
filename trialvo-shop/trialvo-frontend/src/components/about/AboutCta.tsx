"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <section className="border-t border-border bg-muted/40 py-10 md:py-12">
      <div className="container-custom">
        <div className="flex flex-col items-start justify-between gap-5 rounded-xl border border-border bg-card px-5 py-6 sm:px-8 sm:py-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
              {localize(content.title, language)}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {localize(content.supporting, language)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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
              className="h-10 rounded-lg bg-background px-5"
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

export default AboutCta;
