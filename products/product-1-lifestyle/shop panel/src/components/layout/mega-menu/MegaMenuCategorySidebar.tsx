"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight, LayoutGrid, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CategoryImage } from "./MegaMenuCategoryImage";
import type {
  CategoryListProps,
  CategoryNavItemProps,
  CategorySidebarProps,
  CloseActionProps,
  MainCategoryItemsProps,
} from "./MegaMenuPanel.types";
import { hasImagePath } from "./MegaMenuPanel.utils";

const CATEGORY_SKELETON_COUNT = 5;

export function CategorySidebar({
  categories,
  categoriesLoading,
  activeMainId,
  onClose,
  onSelectCategory,
}: Readonly<CategorySidebarProps>): ReactElement {
  return (
    <div className="w-[200px] sm:w-[230px] shrink-0 border-r border-border flex flex-col bg-secondary/30">
      <CategorySidebarHeader onClose={onClose} />

      <CategoryList
        categories={categories}
        isLoading={categoriesLoading}
        activeMainId={activeMainId}
        onSelectCategory={onSelectCategory}
      />

      <BrowseAllLink onClose={onClose} />
    </div>
  );
}

function CategorySidebarHeader({ onClose }: Readonly<CloseActionProps>): ReactElement {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        <LayoutGrid size={16} className="text-accent" />
        <h2 className="font-display text-[13px] font-bold tracking-wider uppercase text-foreground">
          Categories
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground transition-colors active:scale-90 cursor-pointer"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function CategoryList({
  categories,
  isLoading,
  activeMainId,
  onSelectCategory,
}: Readonly<CategoryListProps>): ReactElement {
  return (
    <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Category list">
      {isLoading ? (
        <CategoryListSkeleton />
      ) : (
        <MainCategoryItems
          categories={categories}
          activeMainId={activeMainId}
          onSelectCategory={onSelectCategory}
        />
      )}
    </nav>
  );
}

function CategoryListSkeleton(): ReactElement {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: CATEGORY_SKELETON_COUNT }, (_, index) => (
        <Skeleton key={index} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}

function MainCategoryItems({
  categories,
  activeMainId,
  onSelectCategory,
}: Readonly<MainCategoryItemsProps>): ReactElement {
  if (categories.length === 0) {
    return (
      <p className="px-3 py-4 text-[12px] text-muted-foreground">
        No categories available.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {categories.map((category) => (
        <li key={category.id}>
          <CategoryNavItem
            category={category}
            isActive={activeMainId === category.id}
            onSelectCategory={onSelectCategory}
          />
        </li>
      ))}
    </ul>
  );
}

function CategoryNavItem({
  category,
  isActive,
  onSelectCategory,
}: Readonly<CategoryNavItemProps>): ReactElement {
  const categoryImage = category.image;
  const hasCategoryImage = hasImagePath(categoryImage);

  return (
    <button
      type="button"
      onClick={() => onSelectCategory(category.id)}
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
        {hasCategoryImage ? (
          <span className="w-5 h-5 rounded overflow-hidden shrink-0 bg-secondary border border-border/50">
            <CategoryImage
              imagePath={categoryImage}
              alt={category.name}
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
        <span className="truncate tracking-wide">{category.name}</span>
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

function BrowseAllLink({ onClose }: Readonly<CloseActionProps>): ReactElement {
  return (
    <div className="px-4 py-4 border-t border-border">
      <Link
        href="/shop"
        onClick={onClose}
        className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase text-accent hover:text-accent/80 font-semibold transition-colors cursor-pointer"
      >
        Browse All <ArrowRight size={11} />
      </Link>
    </div>
  );
}
