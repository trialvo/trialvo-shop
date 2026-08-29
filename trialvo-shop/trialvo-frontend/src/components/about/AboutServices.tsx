import { ArrowRight, Check } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/content/services";
import type { MarketplaceLanguage } from "@/types/marketplace";

/**
 * Company capabilities beyond the catalog. The about page otherwise says
 * nothing about the custom work that most enquiries are actually for.
 */
export function AboutServices({
  language,
}: Readonly<{ language: MarketplaceLanguage }>) {
  const content = services(language);

  return (
    <section
      className="border-b border-border py-12 md:py-16"
      aria-labelledby="about-services-title"
    >
      <div className="container-custom">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {content.eyebrow}
          </p>
          <h2
            id="about-services-title"
            className="font-display text-2xl font-bold tracking-tight md:text-3xl"
          >
            {content.title}
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {content.intro}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.entries.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6"
            >
              <h3 className="font-display text-base font-bold leading-6 tracking-tight">
                {entry.name}
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                {entry.summary}
              </p>
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {entry.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-[13px] leading-6 text-foreground/80"
                  >
                    <Check
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {content.ctaNote}
          </p>
          <Button asChild size="sm" className="h-10 shrink-0 rounded-lg">
            <LocalizedLink href="/contact">
              {language === "bn" ? "কোটেশন নিন" : "Get a quote"}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </LocalizedLink>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default AboutServices;
