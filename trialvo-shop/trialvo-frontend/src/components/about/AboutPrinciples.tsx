import { localize } from "@/lib/localize";
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
    <section className="py-12 md:py-16" aria-labelledby="about-principles-title">
      <div className="container-custom">
        <div className="mb-8 max-w-2xl">
          <h2
            id="about-principles-title"
            className="font-display text-2xl font-bold tracking-tight md:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {supporting}
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
          {principles.map((principle) => (
            <li key={principle.id} className="flex gap-4 md:block">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground md:mb-4">
                {principle.step}
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {localize(principle.title, language)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {localize(principle.description, language)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default AboutPrinciples;
