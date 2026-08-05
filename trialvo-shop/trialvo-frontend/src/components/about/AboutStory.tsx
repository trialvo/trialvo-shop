import { localize } from "@/lib/localize";
import type { AboutStoryContent } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type AboutStoryProps = {
  content: AboutStoryContent;
  language: MarketplaceLanguage;
};

/** Readable story block — short paragraphs, standard typography */
export function AboutStory({ content, language }: Readonly<AboutStoryProps>) {
  return (
    <section className="py-12 md:py-16" aria-labelledby="about-story-title">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {localize(content.eyebrow, language)}
          </p>
          <h2
            id="about-story-title"
            className="font-display text-2xl font-bold tracking-tight md:text-3xl"
          >
            {localize(content.title, language)}
          </h2>
          <div className="mt-5 space-y-4">
            {content.paragraphs.map((paragraph) => {
              const text = localize(paragraph, language);
              return (
                <p
                  key={text}
                  className="text-[15px] leading-7 text-muted-foreground md:text-base md:leading-7"
                >
                  {text}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutStory;
