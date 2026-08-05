"use client";

import type { ChildCategory } from "@/lib/api/category/service";
import { cn, getLocalName, toPublicUrl } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import React from "react";
import ProductHero from "./ProductHero";
import ProductHeroSkeleton from "./ProductHeroSkeleton";

export type CategoryGridProps = {
  items: ChildCategory[];
  isLoading: boolean;
  /** Maximum number of items to display (default: 20) */
  maxItems?: number;
};

const MAX_ITEMS = 19;

export default function CategoryGrid({
  items,
  isLoading,
  maxItems = MAX_ITEMS,
}: CategoryGridProps) {
  const { language } = useLanguage();
  const safeItems = React.useMemo(
    () => (Array.isArray(items) ? items : []),
    [items],
  );

  const data = React.useMemo(
    () => safeItems.slice(0, maxItems),
    [safeItems, maxItems],
  );

  const skeletonCount = Math.min(maxItems, 20);

  const topItems = data.slice(0, 3);
  const restItems = data.slice(3);

  const renderCard = (item: ChildCategory, heightClass: string) => {
    const src =
      typeof item?.img_path === "string" && item.img_path.trim().length > 0
        ? toPublicUrl(item.img_path)
        : undefined;

    const displayName = getLocalName(item.name, item.name_bd, language);

    return (
      <div key={item.id}>
        <ProductHero
          title={displayName}
          imageSrc={src ?? undefined}
          ctaHref={`/category/${encodeURIComponent(item?.name ?? "")}?childId=${item?.id}`}
          ctaLabel={displayName}
          variant="below"
          rounded
          heightClassName={heightClass}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`sk-top-${i}`}>
              <ProductHeroSkeleton variant="below" rounded heightClassName="aspect-square" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: Math.min(skeletonCount - 2, 8) }).map((_, i) => (
            <div key={`sk-rest-${i}`}>
              <ProductHeroSkeleton variant="below" rounded heightClassName="aspect-square" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* First 2 items — large, 2 per row */}
      {topItems.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {topItems.map((item) => renderCard(item, "aspect-square"))}
        </div>
      )}

      {/* Remaining items — 4 per row */}
      {restItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {restItems.map((item) => renderCard(item, "aspect-square"))}
        </div>
      )}
    </div>
  );
}
