"use client";

import { ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CategoryImage } from "./MegaMenuCategoryImage";
import type {
  ActiveSubCategoryPanelProps,
  ChildCategoryGridProps,
  ChildCategoryLinkProps,
  CloseActionProps,
  SubCategoryPanelHeaderProps,
} from "./MegaMenuPanel.types";
import {
  getChildCategoryHref,
  getSubCategoryHref,
  hasImagePath,
} from "./MegaMenuPanel.utils";

export function ActiveSubCategoryPanel({
  activeSubCategory,
  activeSubId,
  onClose,
}: Readonly<ActiveSubCategoryPanelProps>): ReactElement {
  const childCategories = activeSubCategory?.children ?? [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeSubCategory && (
        <SubCategoryPanelHeader subCategory={activeSubCategory} onClose={onClose} />
      )}

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {activeSubCategory && childCategories.length > 0 ? (
          <ChildCategoryGrid
            key={activeSubId}
            childCategories={childCategories}
            onClose={onClose}
          />
        ) : (
          <EmptyChildCategoryState />
        )}
      </div>

      <MegaMenuFooter onClose={onClose} />
    </div>
  );
}

function SubCategoryPanelHeader({
  subCategory,
  onClose,
}: Readonly<SubCategoryPanelHeaderProps>): ReactElement {
  const subCategoryImage = subCategory.image;
  const hasSubCategoryImage = hasImagePath(subCategoryImage);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
          {hasSubCategoryImage ? (
            <CategoryImage
              imagePath={subCategoryImage}
              alt={subCategory.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag size={15} className="text-accent" aria-hidden />
          )}
        </div>
        <div>
          <h3 className="font-display text-[14px] font-semibold text-foreground tracking-wide">
            {subCategory.name}
          </h3>
          <Link
            href={getSubCategoryHref(subCategory)}
            onClick={onClose}
            className="text-[11px] text-accent hover:text-accent/80 transition-colors tracking-wide cursor-pointer"
          >
            View all in {subCategory.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChildCategoryGrid({
  childCategories,
  onClose,
}: Readonly<ChildCategoryGridProps>): ReactElement {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1"
      style={{ animation: "var(--animate-fade-in)" }}
    >
      {childCategories.map((childCategory) => (
        <ChildCategoryLink
          key={childCategory.id}
          childCategory={childCategory}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

function ChildCategoryLink({
  childCategory,
  onClose,
}: Readonly<ChildCategoryLinkProps>): ReactElement {
  const childCategoryImage = childCategory.image;
  const hasChildCategoryImage = hasImagePath(childCategoryImage);

  return (
    <Link
      href={getChildCategoryHref(childCategory)}
      onClick={onClose}
      className="group/item flex items-center justify-between gap-1.5 py-2 px-2.5 rounded-md cursor-pointer text-[13px] text-foreground/75 hover:text-accent hover:bg-accent/8 transition-all duration-150"
    >
      <span className="flex items-center gap-2 min-w-0">
        {hasChildCategoryImage ? (
          <span className="w-5 h-5 rounded overflow-hidden shrink-0 bg-secondary border border-border/40">
            <CategoryImage
              imagePath={childCategoryImage}
              alt={childCategory.name}
              className="w-full h-full object-cover"
            />
          </span>
        ) : (
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0 ml-2 mr-1" />
        )}
        <span className="truncate">{childCategory.name}</span>
      </span>
      <ChevronRight
        size={11}
        className="shrink-0 opacity-0 -translate-x-1 group-hover/item:opacity-50 group-hover/item:translate-x-0 transition-all duration-150 text-accent"
      />
    </Link>
  );
}

function EmptyChildCategoryState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <ShoppingBag size={32} className="mb-2 opacity-40" />
      <p className="text-sm">No child categories yet</p>
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
