import { CheckCircle2 } from "lucide-react";
import type { ProductCardFeatureItem } from "@/types/productCard";
import { cn } from "@/lib/utils";

export type ProductCardFeaturesProps = {
  features: ProductCardFeatureItem[];
};

/** Feature strip from API features/facilities — hidden when empty */
export function ProductCardFeatures({
  features,
}: Readonly<ProductCardFeaturesProps>) {
  if (features.length === 0) return null;

  return (
    <ul
      className={cn(
        "grid gap-2 border-y border-border py-3",
        features.length === 1 && "grid-cols-1",
        features.length === 2 && "grid-cols-2",
        features.length >= 3 && "grid-cols-3",
      )}
    >
      {features.map((feature) => (
        <li
          key={feature.id}
          className="flex min-w-0 flex-col items-center gap-1.5 text-center"
        >
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-accent"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span className="line-clamp-2 text-[11px] font-medium leading-tight text-accent/90">
            {feature.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default ProductCardFeatures;
