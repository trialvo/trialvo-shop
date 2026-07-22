import type { AboutHighlightViewModel } from "@/types/about";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

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
    <section
      className="border-b border-border bg-card"
      aria-labelledby="about-highlights-title"
    >
      <div className="container-custom">
        <h2 id="about-highlights-title" className="sr-only">
          {language === "bn" ? "সংক্ষিপ্ত তথ্য" : "At a glance"}
        </h2>
        <ul className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 px-1 py-5 sm:px-4",
                  index % 2 === 1 && "border-l border-border lg:border-l-0",
                  index > 1 && "border-t border-border lg:border-t-0",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold text-foreground">
                    {isLoading && item.id === "products" ? "…" : item.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.label}
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

export default AboutHighlights;
