import { ArrowRight, Check } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Section, SectionIntro, Surface } from "@/components/section";
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
    <Section
      labelledBy="about-services-title"
      tone="muted"
      pattern="dots"
      divider="top"
    >
      <SectionIntro
        id="about-services-title"
        className="mb-8 md:mb-10"
        eyebrow={content.eyebrow}
        title={content.title}
        lead={content.intro}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.entries.map((entry) => (
          <Surface
            as="article"
            key={entry.id}
            sheen
            className="flex h-full flex-col p-6"
          >
            <h3 className="font-display text-base font-bold leading-6 tracking-tight">
              {entry.name}
            </h3>
            <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
              {entry.summary}
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
              {entry.deliverables.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-[13px] leading-6 text-foreground/80"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/[0.12] text-accent ring-1 ring-inset ring-accent/20">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ))}
      </div>

      <Surface
        tone="accent"
        sheen
        className="mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between md:p-7"
      >
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {content.ctaNote}
        </p>
        <Button
          asChild
          size="sm"
          className="h-10 shrink-0 rounded-lg bg-accent px-5 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
        >
          <LocalizedLink href="/contact">
            {language === "bn" ? "কোটেশন নিন" : "Get a quote"}
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </LocalizedLink>
        </Button>
      </Surface>
    </Section>
  );
}

export default AboutServices;
