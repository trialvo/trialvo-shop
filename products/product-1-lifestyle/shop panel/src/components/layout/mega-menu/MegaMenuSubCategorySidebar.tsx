"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight, Layers, ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CategoryImage } from "./MegaMenuCategoryImage";
import type {
  CloseActionProps,
  SubCategoryItemsProps,
  SubCategoryListProps,
  SubCategoryNavItemProps,
  SubCategorySidebarProps,
} from "./MegaMenuPanel.types";
import { getMainCategoryHref, hasImagePath } from "./MegaMenuPanel.utils";

export function SubCategorySidebar({
  subCategories,
  activeSubId,
  activeCategory,
  onClose,
  onSelectSubCategory,
}: Readonly<SubCategorySidebarProps>): ReactElement {
  return (
    <div className="w-[200px] sm:w-[230px] shrink-0 border-r border-border flex flex-col bg-secondary/15">
      <SubCategorySidebarHeader />

      <SubCategoryList
        subCategories={subCategories}
        activeSubId={activeSubId}
        onSelectSubCategory={onSelectSubCategory}
      />

      {activeCategory && (
        <ViewAllCategoryLink categoryName={activeCategory.name} onClose={onClose} />
      )}
    </div>
  );
}

function SubCategorySidebarHeader(): ReactElement {
  return (
    <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
      <Layers size={16} className="text-accent" />
      <h2 className="font-display text-[13px] font-bold tracking-wider uppercase text-foreground">
        Subcategories
      </h2>
    </div>
  );
}

function SubCategoryList({
  subCategories,
  activeSubId,
  onSelectSubCategory,
}: Readonly<SubCategoryListProps>): ReactElement {
  return (
    <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Subcategory list">
      <SubCategoryItems
        subCategories={subCategories}
        activeSubId={activeSubId}
        onSelectSubCategory={onSelectSubCategory}
      />
    </nav>
  );
}

function SubCategoryItems({
  subCategories,
  activeSubId,
  onSelectSubCategory,
}: Readonly<SubCategoryItemsProps>): ReactElement {
  if (subCategories.length === 0) {
    return (
      <p className="px-3 py-4 text-[12px] text-muted-foreground">
        No subcategories available.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {subCategories.map((subCategory) => (
        <li key={subCategory.id}>
          <SubCategoryNavItem
            subCategory={subCategory}
            isActive={activeSubId === subCategory.id}
            onSelectSubCategory={onSelectSubCategory}
          />
        </li>
      ))}
    </ul>
  );
}

function SubCategoryNavItem({
  subCategory,
  isActive,
  onSelectSubCategory,
}: Readonly<SubCategoryNavItemProps>): ReactElement {
  const subCategoryImage = subCategory.image;
  const hasSubCategoryImage = hasImagePath(subCategoryImage);

  return (
    <button
      type="button"
      onClick={() => onSelectSubCategory(subCategory.id)}
      className={cn(
        "relative flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-lg text-left",
        "cursor-pointer select-none transition-all duration-200 group text-[13px]",
        isActive
          ? "bg-accent/10 text-accent font-medium ring-1 ring-accent/20"
          : "text-foreground/80 hover:bg-background hover:text-foreground"
      )}
      aria-pressed={isActive}
    >
      <span
        className={cn(
          "absolute left-2 top-2 bottom-2 w-[3px] rounded-full transition-all duration-200",
          isActive ? "bg-accent opacity-100" : "opacity-0"
        )}
      />
      <span className="flex items-center gap-2.5 pl-2 min-w-0">
        {hasSubCategoryImage ? (
          <span className="w-5 h-5 rounded overflow-hidden shrink-0 bg-secondary border border-border/50">
            <CategoryImage
              imagePath={subCategoryImage}
              alt={subCategory.name}
              className="w-full h-full object-cover"
            />
          </span>
        ) : (
          <ShoppingBag
            size={14}
            className={cn(
              "shrink-0 transition-colors",
              isActive ? "text-accent" : "text-foreground/50 group-hover:text-foreground/80"
            )}
            aria-hidden
          />
        )}
        <span className="truncate tracking-wide">{subCategory.name}</span>
      </span>
      <ChevronRight
        size={12}
        className={cn(
          "shrink-0 transition-all duration-200",
          isActive ? "opacity-100 translate-x-0.5" : "opacity-25"
        )}
      />
    </button>
  );
}

function ViewAllCategoryLink({
  categoryName,
  onClose,
}: Readonly<CloseActionProps & { categoryName: string }>): ReactElement {
  return (
    <div className="px-4 py-4 border-t border-border">
      <Link
        href={getMainCategoryHref({ name: categoryName })}
        onClick={onClose}
        className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase text-accent hover:text-accent/80 font-semibold transition-colors cursor-pointer"
      >
        View all <ArrowRight size={11} />
      </Link>
    </div>
  );
}
