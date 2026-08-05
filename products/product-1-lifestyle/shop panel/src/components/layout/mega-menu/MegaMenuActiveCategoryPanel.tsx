"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CategoryImage } from "./MegaMenuCategoryImage";
import { SubCategoryGroup } from "./MegaMenuSubCategoryGroup";
import type {
  ActiveCategoryPanelProps,
  CategoryPanelHeaderProps,
  CloseActionProps,
  SubCategoryGridProps,
} from "./MegaMenuPanel.types";
import { getMainCategoryHref, hasImagePath } from "./MegaMenuPanel.utils";

export function ActiveCategoryPanel({
  activeCategory,
  activeMainId,
  onClose,
}: Readonly<ActiveCategoryPanelProps>): ReactElement {
  const subCategories = activeCategory?.children ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeCategory && <CategoryPanelHeader category={activeCategory} onClose={onClose} />}

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {activeCategory && subCategories.length > 0 ? (
          <SubCategoryGrid
            key={activeMainId}
            subCategories={subCategories}
            onClose={onClose}
          />
        ) : (
          <EmptySubCategoryState />
        )}
      </div>

      <MegaMenuFooter onClose={onClose} />
    </div>
  );
}

function CategoryPanelHeader({
  category,
  onClose,
}: Readonly<CategoryPanelHeaderProps>): ReactElement {
  const categoryImage = category.image;
  const hasCategoryImage = hasImagePath(categoryImage);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
          {hasCategoryImage ? (
            <CategoryImage
              imagePath={categoryImage}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag size={15} className="text-accent" aria-hidden />
          )}
        </div>
        <div>
          <h3 className="font-display text-[14px] font-semibold text-foreground tracking-wide">
            {category.name}
          </h3>
          <Link
            href={getMainCategoryHref(category)}
            onClick={onClose}
            className="text-[11px] text-accent hover:text-accent/80 transition-colors tracking-wide cursor-pointer"
          >
            View all in {category.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SubCategoryGrid({
  subCategories,
  onClose,
}: Readonly<SubCategoryGridProps>): ReactElement {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6"
      style={{ animation: "var(--animate-fade-in)" }}
    >
      {subCategories.map((subCategory) => (
        <SubCategoryGroup key={subCategory.id} subCategory={subCategory} onClose={onClose} />
      ))}
    </div>
  );
}

function EmptySubCategoryState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <ShoppingBag size={32} className="mb-2 opacity-40" />
      <p className="text-sm">No subcategories yet</p>
    </div>
  );
}

function MegaMenuFooter({ onClose }: Readonly<CloseActionProps>): ReactElement {
  return (
    <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
      <p className="text-[12px] text-muted-foreground tracking-wide">
        Can&apos;t find what you need?
      </p>
      <Link
        href="/shop"
        onClick={onClose}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors tracking-wide uppercase cursor-pointer"
      >
        Browse All Products <ArrowRight size={12} />
      </Link>
    </div>
  );
}
