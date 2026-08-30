import type { AboutHighlightViewModel } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { IconTile, Section, Surface } from "@/components/section";

export type AboutHighlightsProps = {
  items: AboutHighlightViewModel[];
  language: MarketplaceLanguage;
  isLoading?: boolean;
};

/** Compact trust strip under the header — easy to scan */
export function AboutHighlights({
  items,
  language,
  isLoading = false,
}: Readonly<AboutHighlightsProps>) {
  return (
    <Section
      labelledBy="about-highlights-title"
      size="sm"
      divider="bottom"
      className="py-8 md:py-10"
    >
      <h2 id="about-highlights-title" className="sr-only">
        {language === "bn" ? "সংক্ষিপ্ত তথ্য" : "At a glance"}
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Surface
              as="li"
              key={item.id}
              sheen
              className="flex items-center gap-3 p-4 sm:p-5"
            >
              <IconTile icon={Icon} size="sm" />
              <div className="min-w-0">
                <p className="font-display text-base font-bold leading-6 tracking-tight text-foreground">
                  {isLoading && item.id === "products" ? "…" : item.value}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </Surface>
          );
        })}
      </ul>
    </Section>
  );
}

export default AboutHighlights;
