import { Check } from "lucide-react";
import type { ProductCardFeatureItem } from "@/types/productCard";

const MAX_VISIBLE = 3;

export type ProductCardFeaturesProps = {
  features: ProductCardFeatureItem[];
};

/** Quiet feature list — plain checked lines, no chips. */
export function ProductCardFeatures({
  features,
}: Readonly<ProductCardFeaturesProps>) {
  if (features.length === 0) return null;

  const visible = features.slice(0, MAX_VISIBLE);
  const extra = features.length - visible.length;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {visible.map((feature) => (
        <li
          key={feature.id}
          className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-medium leading-none text-muted-foreground"
        >
          <Check className="h-3 w-3 shrink-0 text-accent" strokeWidth={2.5} aria-hidden="true" />
          <span className="truncate">{feature.label}</span>
        </li>
      ))}
      {extra > 0 ? (
        <li className="text-[11px] font-medium leading-none text-muted-foreground">
          +{extra}
        </li>
      ) : null}
    </ul>
  );
}

export default ProductCardFeatures;
