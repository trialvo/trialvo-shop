"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Loader2, Package, Search } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Input } from "@/components/ui/input";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { trialCopy } from "@/lib/trial/copy";
import {
  productDisplayName,
  productSupportsDemo,
  productSupportsDomainTrial,
  type TrialPath,
  type TrialProductRef,
} from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

/**
 * First step when a trial dialog opens without a product in scope (home page
 * CTAs). Lists trialable products that support the requested path.
 */
export function ProductPickerStep({
  path,
  language,
  onPick,
}: Readonly<{
  path: TrialPath;
  language: MarketplaceLanguage;
  onPick: (product: TrialProductRef) => void;
}>) {
  const copy = trialCopy(language);
  const { data: products = [], isLoading } = useProducts();
  const [query, setQuery] = useState("");

  const eligible = useMemo(() => {
    const supports = path === "demo" ? productSupportsDemo : productSupportsDomainTrial;
    const q = query.trim().toLowerCase();
    return (products as Product[])
      .filter((p) => p.isActive && p.isTrialable && supports(p))
      .filter((p) => {
        if (!q) return true;
        const name = productDisplayName(p, language).toLowerCase();
        return name.includes(q) || p.slug.includes(q) || (p.category || "").toLowerCase().includes(q);
      });
  }, [products, path, query, language]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{copy.picker.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{copy.picker.lead}</p>
      </div>

      {products.length > 6 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.picker.search}
            className="h-11 rounded-lg pl-10"
            aria-label={copy.picker.search}
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-10" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : eligible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {copy.picker.empty}
        </p>
      ) : (
        <ul className="-mx-1 max-h-[50vh] space-y-1.5 overflow-y-auto px-1 py-0.5">
          {eligible.map((p) => {
            const thumb = resolveMediaUrl(p.thumbnail);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPick(p)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                    {thumb ? (
                      <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-bold tracking-tight text-foreground">
                      {productDisplayName(p, language)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {p.shortDescription?.[language] || p.shortDescription?.en || p.category}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-strong" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ProductPickerStep;
