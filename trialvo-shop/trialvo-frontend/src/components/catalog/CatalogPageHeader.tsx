import { useLanguage } from "@/contexts/LanguageContext";

export type CatalogPageHeaderProps = {
  title: string;
  description: string;
};

/** Catalog page intro — brand-aligned, single purpose */
export function CatalogPageHeader({
  title,
  description,
}: Readonly<CatalogPageHeaderProps>) {
  const { language } = useLanguage();

  return (
    <header className="mb-8 max-w-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        {language === "bn" ? "মার্কেটপ্লেস ক্যাটালগ" : "Marketplace catalog"}
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
        {description}
      </p>
    </header>
  );
}

export default CatalogPageHeader;
