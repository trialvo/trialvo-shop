import { localize } from "@/lib/localize";
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
    <section
      className="border-y border-border bg-muted/25 py-12 md:py-16"
      aria-labelledby="about-values-title"
    >
      <div className="container-custom">
        <div className="mb-8 max-w-2xl">
          <h2
            id="about-values-title"
            className="font-display text-2xl font-bold tracking-tight md:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {supporting}
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <li
                key={value.id}
                className="flex gap-4 rounded-lg border border-border/80 bg-background p-5"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    {localize(value.title, language)}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {localize(value.description, language)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default AboutValues;
