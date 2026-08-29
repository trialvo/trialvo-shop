import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Button } from "@/components/ui/button";
import { ArrowRight, FlaskConical } from "lucide-react";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ProductCardActionsProps = {
  href: string;
  language: MarketplaceLanguage;
  showTrial: boolean;
  onStartTrial: () => void;
  compact?: boolean;
};

/** Footer CTAs — trial is a real button, not a text link. */
export function ProductCardActions({
  href,
  language,
  showTrial,
  onStartTrial,
  compact = false,
}: Readonly<ProductCardActionsProps>) {
  const trialLabel = language === "bn" ? "ফ্রি ট্রায়াল" : "Start free trial";
  const detailsLabel = language === "bn" ? "বিস্তারিত" : "View details";

  return (
    <div className={compact ? "mt-3 flex gap-2" : "mt-4 flex gap-2"}>
      {showTrial ? (
        <Button
          type="button"
          size="sm"
          className="h-9 flex-1 rounded-lg bg-foreground text-background shadow-none hover:bg-foreground/90"
          onClick={onStartTrial}
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
          {trialLabel}
        </Button>
      ) : null}
      <Button
        asChild
        size="sm"
        variant="outline"
        className={showTrial ? "h-9 flex-1 rounded-lg bg-background" : "h-9 w-full rounded-lg bg-background"}
      >
        <LocalizedLink href={href}>
          {detailsLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </LocalizedLink>
      </Button>
    </div>
  );
}

export default ProductCardActions;
