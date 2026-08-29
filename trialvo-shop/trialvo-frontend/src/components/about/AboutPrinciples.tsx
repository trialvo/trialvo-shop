import { localize } from "@/lib/localize";
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";
import type { AboutPrincipleItem } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type AboutPrinciplesProps = {
  principles: AboutPrincipleItem[];
  language: MarketplaceLanguage;
  title: string;
  supporting: string;
};

/** Simple numbered steps — clear path for users */
export function AboutPrinciples({
  principles,
  language,
  title,
  supporting,
}: Readonly<AboutPrinciplesProps>) {
  return (
    <Section labelledBy="about-principles-title" divider="top">
      <SectionIntro
        id="about-principles-title"
        className="mb-8 md:mb-10"
        title={title}
        lead={supporting}
      />

      <ol className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Rail tying the steps together as one sequence; offset matches the
            icon centre for a p-6 card with a medium IconTile. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[2.875rem] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
        />
        {principles.map((principle) => (
          <li key={principle.id} className="relative">
            <Surface sheen className="h-full p-6">
              <IconTile className="mb-4">
                <span className="font-display text-sm font-bold tabular-nums">
                  {principle.step}
                </span>
              </IconTile>
              <h3 className="font-display text-base font-bold leading-6 tracking-tight text-foreground">
                {localize(principle.title, language)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {localize(principle.description, language)}
              </p>
            </Surface>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default AboutPrinciples;
