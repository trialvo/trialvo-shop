"use client";

import { useState } from "react";
import { FileText, Store } from "lucide-react";
import ScreenshotGallery from "@/components/gallery/ScreenshotGallery";
import { Surface } from "@/components/section";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailGalleryProps = {
  product: Product;
  language: MarketplaceLanguage;
  shopLabel: string;
  adminLabel: string;
};

/** Shop / admin screenshot sets, switched with a quiet underline tab row. */
export function ProductDetailGallery({
  product,
  language,
  shopLabel,
  adminLabel,
}: Readonly<ProductDetailGalleryProps>) {
  const [pane, setPane] = useState<"shop" | "admin">("shop");

  const shop = (product.images?.shop || []).map(resolveMediaUrl).filter(Boolean);
  const admin = (product.images?.admin || []).map(resolveMediaUrl).filter(Boolean);
  const fallback = [resolveMediaUrl(product.thumbnail)].filter(Boolean);

  const tabs = [
    { id: "shop" as const, icon: Store, label: shopLabel, images: shop },
    { id: "admin" as const, icon: FileText, label: adminLabel, images: admin },
  ].filter((tab) => tab.images.length > 0);

  const active = tabs.find((tab) => tab.id === pane) ?? tabs[0];
  const shown = active?.images.length ? active.images : fallback;

  return (
    <div>
      {tabs.length > 1 ? (
        <div
          className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
          role="tablist"
          aria-label={language === "bn" ? "স্ক্রিনশট সেট" : "Screenshot set"}
        >
          {tabs.map((tab) => {
            const isActive = active?.id === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setPane(tab.id)}
                className={cn(
                  // Tighter on phones so both sets fit without scrolling; the
                  // row still scrolls if a label ever grows.
                  "-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm",
                  isActive
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
                <span className="text-xs font-normal tabular-nums text-muted-foreground">
                  {tab.images.length}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <Surface sheen className="p-2.5 sm:p-3">
        <ScreenshotGallery
          key={active?.id ?? "fallback"}
          images={shown}
          title={product.name[language] || product.name.en}
        />
      </Surface>
    </div>
  );
}

export default ProductDetailGallery;
