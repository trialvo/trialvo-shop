import { localize } from "@/lib/localize";
import { IconTile, Section, SectionIntro, Surface } from "@/components/section";
import type { AboutValueItem } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type AboutValuesProps = {
  values: AboutValueItem[];
  language: MarketplaceLanguage;
  title: string;
  supporting: string;
};

/**
 * Standard values list — light rows, no heavy card stack.
 * Easier to read on mobile and desktop.
 */
export function AboutValues({
  values,
  language,
  title,
  supporting,
}: Readonly<AboutValuesProps>) {
  return (
    <Section labelledBy="about-values-title" divider="top">
      <SectionIntro
        id="about-values-title"
        className="mb-8 md:mb-10"
        title={title}
        lead={supporting}
      />

      <ul className="grid gap-4 sm:grid-cols-2">
        {values.map((value) => {
          const Icon = value.icon;
          return (
            <Surface
              as="li"
              key={value.id}
              sheen
              className="flex gap-4 p-5 md:p-6"
            >
              <IconTile icon={Icon} className="mt-0.5" />
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-6 tracking-tight text-foreground">
                  {localize(value.title, language)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {localize(value.description, language)}
                </p>
              </div>
            </Surface>
          );
        })}
      </ul>
    </Section>
  );
}

export default AboutValues;
