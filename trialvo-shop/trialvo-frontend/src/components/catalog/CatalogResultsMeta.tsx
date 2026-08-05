import { useLanguage } from "@/contexts/LanguageContext";

export type CatalogResultsMetaProps = {
  count: number;
  isLoading?: boolean;
  searchQuery?: string;
  categoryLabel?: string;
};

/** Results count + context line under filters */
export function CatalogResultsMeta({
  count,
  isLoading = false,
  searchQuery,
  categoryLabel,
}: Readonly<CatalogResultsMetaProps>) {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {language === "bn" ? "প্রোডাক্ট লোড হচ্ছে…" : "Loading products…"}
      </p>
    );
  }

  const countLabel =
    language === "bn"
      ? `${count} টি প্রোডাক্ট`
      : `${count} product${count === 1 ? "" : "s"}`;

  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{countLabel}</span>
      {categoryLabel ? (
        <span>
          {" "}
          · {language === "bn" ? "ক্যাটাগরি" : "in"}{" "}
          <span className="text-foreground">{categoryLabel}</span>
        </span>
      ) : null}
      {searchQuery ? (
        <span>
          {" "}
          · {language === "bn" ? "সার্চ" : "for"} “{searchQuery}”
        </span>
      ) : null}
    </p>
  );
}

export default CatalogResultsMeta;
