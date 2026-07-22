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
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_10%,hsl(153_72%_40%/0.22),transparent_48%)]"
          aria-hidden="true"
        />
      </div>

      <div className="container-custom relative z-10 flex min-h-[260px] items-end py-12 md:min-h-[320px] md:items-center md:py-16">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {localize(content.eyebrow, language)}
          </p>
          <h1
            id="contact-hero-heading"
            className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
          >
            {localize(content.title, language)}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            {localize(content.supporting, language)}
          </p>
        </div>
      </div>
    </section>
  );
}

export default ContactHero;
