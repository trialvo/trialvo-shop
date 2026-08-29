import { ArrowRight } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { faqHighlights } from "@/lib/content/faq";

/** Highest-intent questions on the home page, with the full set one click away. */
export function HomeFaq() {
  const { language } = useLanguage();
  const entries = faqHighlights(language);

  return (
    <section className="border-t border-border bg-muted/25 py-14 md:py-20" aria-labelledby="home-faq-title">
      <div className="container-custom">
        <div className="grid gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-14">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {language === "bn" ? "প্রশ্নোত্তর" : "Questions"}
            </p>
            <h2
              id="home-faq-title"
              className="font-display text-2xl font-bold tracking-tight md:text-3xl"
            >
              {language === "bn"
                ? "ক্রেতারা যা সবচেয়ে বেশি জিজ্ঞেস করেন"
                : "What buyers ask most"}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              {language === "bn"
                ? "লাইসেন্স, পেমেন্ট, ট্রায়াল ও সাপোর্ট নিয়ে দ্রুত উত্তর। আরও বিস্তারিত প্রশ্নোত্তর পূর্ণ পেজে আছে।"
                : "Quick answers on licensing, payment, trials, and support. The full set of questions is on the FAQ page."}
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-5 h-10 rounded-lg bg-background"
            >
              <LocalizedLink href="/faq">
                {language === "bn" ? "সব প্রশ্নোত্তর দেখুন" : "See all questions"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </LocalizedLink>
            </Button>
          </div>

          <FaqAccordion entries={entries} defaultOpenFirst />
        </div>
      </div>
    </section>
  );
}

export default HomeFaq;
