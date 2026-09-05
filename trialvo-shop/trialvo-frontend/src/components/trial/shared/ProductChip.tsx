"use client";

import { Package } from "lucide-react";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { productDisplayName, type TrialProductRef } from "@/lib/trial/types";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { cn } from "@/lib/utils";

/** Small "you are trialling X" identifier shown at the top of both dialogs. */
export function ProductChip({
  product,
  language,
  onChange,
  changeLabel,
  className,
}: Readonly<{
  product: TrialProductRef;
  language: MarketplaceLanguage;
  onChange?: () => void;
  changeLabel?: string;
  className?: string;
}>) {
  const thumb = product.thumbnail ? resolveMediaUrl(product.thumbnail) : null;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5",
        className,
      )}
    >
      <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
        {thumb ? (
          <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <Package className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold tracking-tight text-foreground">
          {productDisplayName(product, language)}
        </span>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">{product.slug}</span>
      </span>
      {onChange ? (
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-accent-strong hover:bg-accent/10"
        >
          {changeLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ProductChip;
