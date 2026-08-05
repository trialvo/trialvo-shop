"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { CategoryImage } from "./MegaMenuCategoryImage";
import type {
  ChildCategoryLinkProps,
  ChildCategoryListProps,
  SubCategoryGroupProps,
} from "./MegaMenuPanel.types";
import {
  getChildCategoryHref,
  getSubCategoryHref,
  hasImagePath,
} from "./MegaMenuPanel.utils";

export function SubCategoryGroup({
  subCategory,
  onClose,
}: Readonly<SubCategoryGroupProps>): ReactElement {
  const childCategories = subCategory.children ?? [];
  const subCategoryImage = subCategory.image;
  const hasSubCategoryImage = hasImagePath(subCategoryImage);

  return (
    <div>
      <Link
        href={getSubCategoryHref(subCategory)}
        onClick={onClose}
        className="flex items-center gap-2 mb-2 pb-2 border-b border-border group/sub cursor-pointer"
      >
        {hasSubCategoryImage && (
          <span className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-secondary border border-border/50">
            <CategoryImage
              imagePath={subCategoryImage}
              alt={subCategory.name}
              className="w-full h-full object-cover"
            />
          </span>
        )}
        <span className="text-[12px] font-semibold tracking-[0.15em] uppercase text-foreground/90 group-hover/sub:text-accent transition-colors truncate flex-1">
          {subCategory.name}
        </span>
        <ArrowRight
          size={10}
          className="text-muted-foreground opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0"
        />
      </Link>

      {childCategories.length > 0 ? (
        <ChildCategoryList childCategories={childCategories} onClose={onClose} />
      ) : (
        <p className="text-[11px] text-muted-foreground/60 px-2 py-1 italic">No items</p>
      )}
    </div>
  );
}

function ChildCategoryList({
  childCategories,
  onClose,
}: Readonly<ChildCategoryListProps>): ReactElement {
  return (
    <ul className="space-y-0.5">
      {childCategories.map((childCategory) => (
        <li key={childCategory.id}>
          <ChildCategoryLink childCategory={childCategory} onClose={onClose} />
        </li>
      ))}
    </ul>
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
      className="group/item flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-md cursor-pointer text-[13px] text-foreground/75 hover:text-accent hover:bg-accent/8 transition-all duration-150"
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
