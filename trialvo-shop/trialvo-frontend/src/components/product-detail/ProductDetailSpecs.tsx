"use client";

import { Check } from "lucide-react";
import { Surface } from "@/components/section";

export type ProductDetailSpecsProps = {
  id: string;
  eyebrow: string;
  title: string;
  items: string[];
};

/**
 * Shared list block for features and facilities. Rows use hairline separators
 * rather than one card per item, which keeps a long list readable.
 */
export function ProductDetailSpecs({
  id,
  eyebrow,
  title,
  items,
}: Readonly<ProductDetailSpecsProps>) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={id}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-strong">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-2 font-display text-xl font-bold tracking-tight text-foreground"
      >
        {title}
      </h2>

      <Surface className="mt-4 overflow-hidden">
        <ul>
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 border-b border-border/70 px-5 py-3.5 last:border-b-0"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                aria-hidden="true"
              />
              <span className="text-sm leading-6 text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Surface>
    </section>
  );
}

export default ProductDetailSpecs;
