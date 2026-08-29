"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/section";

/** Closing marketplace CTA before footer */
export function MarketplaceCTA() {
  const { language } = useLanguage();

  return (
    <Section
      labelledBy="marketplace-cta-title"
      size="sm"
      divider="top"
      className="py-12 md:py-16"
    >
      <motion.div
        className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground shadow-soft-xl md:px-12 md:py-14"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
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

        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <Eyebrow tone="inverted" className="mb-4">
              {language === "bn" ? "শুরু করুন" : "Get started"}
            </Eyebrow>
            <h2
              id="marketplace-cta-title"
              className="font-display text-[1.75rem] font-bold leading-[1.16] tracking-tight md:text-[2.25rem]"
            >
              {language === "bn"
                ? "রেডিমেড ডিজিটাল সলিউশন খুঁজুন"
                : "Browse ready-made digital solutions"}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-primary-foreground/70 md:text-base">
              {language === "bn"
                ? "ট্রায়াল করে কিনুন—অথবা কাস্টম সফটওয়্যার, DevOps ও মেইনটেন্যান্সের জন্য যোগাযোগ করুন।"
                : "Trial then buy—or contact us for custom software, DevOps, and maintenance."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-lg bg-accent px-7 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
            >
              <LocalizedLink href="/products">
                {language === "bn" ? "মার্কেটপ্লেস খুলুন" : "Open marketplace"}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </LocalizedLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-lg border-primary-foreground/25 bg-primary-foreground/[0.06] px-6 text-primary-foreground hover:border-primary-foreground/40 hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <LocalizedLink href="/contact">
                {language === "bn" ? "যোগাযোগ করুন" : "Talk to us"}
              </LocalizedLink>
            </Button>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

export default MarketplaceCTA;
