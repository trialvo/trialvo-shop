import { useLanguage } from "@/contexts/LanguageContext";
import { Eyebrow } from "@/components/section";

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
    <header className="mb-8 max-w-3xl">
      <Eyebrow className="mb-4">
        {language === "bn" ? "মার্কেটপ্লেস ক্যাটালগ" : "Marketplace catalog"}
      </Eyebrow>
      <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.5rem] md:text-[3rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-base md:leading-[1.75]">
        {description}
      </p>
    </header>
  );
}

export default CatalogPageHeader;
