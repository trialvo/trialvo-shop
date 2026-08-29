import { Eyebrow } from "@/components/section";
import { localize } from "@/lib/localize";
import type { ContactHeroContent } from "@/types/contact";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ContactHeroProps = {
  content: ContactHeroContent;
  language: MarketplaceLanguage;
};

/** Standard contact banner — workspace photo + readable overlay */
export function ContactHero({ content, language }: Readonly<ContactHeroProps>) {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="contact-hero-heading"
    >
      <div className="absolute inset-0">
        <img
          src={content.image.src}
          alt={localize(content.image.alt, language)}
          className="h-full w-full object-cover object-[center_35%]"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(105deg,hsl(220_22%_8%/0.88)_0%,hsl(220_18%_10%/0.72)_45%,hsl(220_14%_12%/0.5)_100%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_10%,hsl(153_72%_40%/0.24),transparent_48%)]"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="pattern-grid absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_25%_50%,black,transparent_72%)]"
        />
        {/* Melt the photo into the next band instead of a hard cut. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
        />
      </div>

      <div className="container-custom relative z-10 flex min-h-[300px] items-end py-14 md:min-h-[380px] md:items-center md:py-20">
        <div className="max-w-2xl">
          {/* The scrim is dark in both themes, so the label is pinned to white
              rather than a theme token that would invert and disappear. */}
          <Eyebrow className="mb-4 text-white/70">
            {localize(content.eyebrow, language)}
          </Eyebrow>
          <h1
            id="contact-hero-heading"
            className="font-display text-[2.125rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.875rem]"
          >
            {localize(content.title, language)}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/75 md:text-base md:leading-[1.75]">
            {localize(content.supporting, language)}
          </p>
        </div>
      </div>
    </section>
  );
}

export default ContactHero;
