import { localize } from "@/lib/localize";
import { Section, SectionIntro } from "@/components/section";
import type { AboutStoryContent } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type AboutStoryProps = {
  content: AboutStoryContent;
  language: MarketplaceLanguage;
};

/** Readable story block — short paragraphs, standard typography */
export function AboutStory({ content, language }: Readonly<AboutStoryProps>) {
  return (
    <Section labelledBy="about-story-title" tone="muted" pattern="mesh">
      <div className="mx-auto max-w-3xl">
        <SectionIntro
          id="about-story-title"
          className="mb-6 md:mb-8"
          eyebrow={localize(content.eyebrow, language)}
          title={localize(content.title, language)}
        />
        <div className="space-y-4">
          {content.paragraphs.map((paragraph) => {
            const text = localize(paragraph, language);
            return (
              <p
                key={text}
                className="text-[15px] leading-7 text-muted-foreground md:text-base md:leading-[1.75]"
              >
                {text}
              </p>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

export default AboutStory;
