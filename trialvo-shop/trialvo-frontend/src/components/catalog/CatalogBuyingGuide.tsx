"use client";

import { Check } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { buyingGuide } from "@/lib/content/buyingGuide";
import { faqHighlights } from "@/lib/content/faq";
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";

/**
 * Editorial content below the catalog grid. Filters live in the query string,
 * so this text is the same on every filtered view — it is the page's stable,
 * indexable body copy.
 */
export function CatalogBuyingGuide() {
  const { language } = useLanguage();
  const guide = buyingGuide(language);
  const faqs = faqHighlights(language);

  return (
    <>
      <Section
        labelledBy="buying-guide-title"
        tone="muted"
        pattern="dots"
        divider="both"
      >
        <SectionIntro
          id="buying-guide-title"
          eyebrow={guide.eyebrow}
          title={guide.title}
          lead={guide.intro}
        />

        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          {guide.sections.map((section, index) => (
            <Surface
              as="article"
              key={section.id}
              sheen
              className="p-6 md:p-7"
            >
              <div className="flex items-center gap-3">
                <IconTile size="sm" className="text-[13px] font-bold">
                  {index + 1}
                </IconTile>
                <h3 className="font-display text-[17px] font-bold leading-6 tracking-tight">
                  {section.title}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {section.body}
              </p>
              <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
                {section.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-[13px] leading-6 text-foreground/80"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/[0.12] text-accent ring-1 ring-inset ring-accent/20">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Surface>
          ))}
        </div>

        <Surface
          tone="accent"
          sheen
          className="mt-6 p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8"
        >
          <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
            {guide.closing}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
            <Button
              asChild
              size="sm"
              className="h-11 rounded-lg bg-accent px-5 font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
            >
              <LocalizedLink href="/how-it-works">
                {language === "bn" ? "প্রক্রিয়া দেখুন" : "See the process"}
              </LocalizedLink>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-11 rounded-lg bg-background px-5 shadow-card"
            >
              <LocalizedLink href="/contact">
                {language === "bn" ? "পরামর্শ নিন" : "Ask for advice"}
              </LocalizedLink>
            </Button>
          </div>
        </Surface>
      </Section>

      <Section labelledBy="catalog-faq-title">
        <SectionIntro
          id="catalog-faq-title"
          className="mb-8 md:mb-10"
          eyebrow={language === "bn" ? "প্রশ্নোত্তর" : "Questions"}
          title={
            language === "bn"
              ? "কেনার আগে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্ন"
              : "The questions buyers ask most"
          }
          lead={
            language === "bn"
              ? "লাইসেন্স, ট্রায়াল, হোস্টিং ও সাপোর্ট নিয়ে সংক্ষিপ্ত উত্তর। পূর্ণ তালিকা FAQ পেজে আছে।"
              : "Short answers on licensing, trials, hosting, and support. The full list is on the FAQ page."
          }
        />
        <FaqAccordion entries={faqs} defaultOpenFirst />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-6 h-11 rounded-lg px-5 shadow-card"
        >
          <LocalizedLink href="/faq">
            {language === "bn" ? "সব প্রশ্ন দেখুন" : "Read all questions"}
          </LocalizedLink>
        </Button>
      </Section>
    </>
  );
}

export default CatalogBuyingGuide;
