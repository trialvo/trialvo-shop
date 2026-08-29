"use client";

import { Check } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { buyingGuide } from "@/lib/content/buyingGuide";
import { faqHighlights } from "@/lib/content/faq";

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
      <section
        className="border-t border-border bg-muted/25 py-14 md:py-20"
        aria-labelledby="buying-guide-title"
      >
        <div className="container-custom">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {guide.eyebrow}
            </p>
            <h2
              id="buying-guide-title"
              className="font-display text-2xl font-bold tracking-tight md:text-3xl"
            >
              {guide.title}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              {guide.intro}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:gap-6">
            {guide.sections.map((section, index) => (
              <article
                key={section.id}
                className="rounded-2xl border border-border bg-card p-6 md:p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-[13px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <h3 className="font-display text-[17px] font-bold leading-6 tracking-tight">
                    {section.title}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {section.body}
                </p>
                <ul className="mt-4 space-y-2.5 border-t border-border pt-4">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-[13px] leading-6 text-foreground/80"
                    >
                      <Check
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
            <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {guide.closing}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
              <Button asChild size="sm" className="h-10 rounded-lg">
                <LocalizedLink href="/how-it-works">
                  {language === "bn" ? "প্রক্রিয়া দেখুন" : "See the process"}
                </LocalizedLink>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-10 rounded-lg bg-background"
              >
                <LocalizedLink href="/contact">
                  {language === "bn" ? "পরামর্শ নিন" : "Ask for advice"}
                </LocalizedLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-border py-14 md:py-20"
        aria-labelledby="catalog-faq-title"
      >
        <div className="container-custom">
          <div className="mb-8 max-w-3xl">
            <h2
              id="catalog-faq-title"
              className="font-display text-2xl font-bold tracking-tight md:text-3xl"
            >
              {language === "bn"
                ? "কেনার আগে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্ন"
                : "The questions buyers ask most"}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              {language === "bn"
                ? "লাইসেন্স, ট্রায়াল, হোস্টিং ও সাপোর্ট নিয়ে সংক্ষিপ্ত উত্তর। পূর্ণ তালিকা FAQ পেজে আছে।"
                : "Short answers on licensing, trials, hosting, and support. The full list is on the FAQ page."}
            </p>
          </div>
          <FaqAccordion entries={faqs} defaultOpenFirst />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-6 h-10 rounded-lg"
          >
            <LocalizedLink href="/faq">
              {language === "bn" ? "সব প্রশ্ন দেখুন" : "Read all questions"}
            </LocalizedLink>
          </Button>
        </div>
      </section>
    </>
  );
}

export default CatalogBuyingGuide;
