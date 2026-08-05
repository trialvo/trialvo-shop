"use client";

import { useCategory, type Category, type SubCategory } from "@/hooks/useCategory";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { ActiveSubCategoryPanel } from "./mega-menu/MegaMenuActiveSubCategoryPanel";
import { MegaMenuBackdrop } from "./mega-menu/MegaMenuBackdrop";
import { CategorySidebar } from "./mega-menu/MegaMenuCategorySidebar";
import { MegaMenuDrawer } from "./mega-menu/MegaMenuDrawer";
import { SubCategorySidebar } from "./mega-menu/MegaMenuSubCategorySidebar";
import type {
  CategoryId,
  CloseMenuHandler,
  MegaMenuPanelProps,
  SubCategoryId,
} from "./mega-menu/MegaMenuPanel.types";

export type { MegaMenuPanelProps } from "./mega-menu/MegaMenuPanel.types";

/* ── MegaMenuPanel — dynamic, 3-level category drawer ──────────────── */
export function MegaMenuPanel({ isOpen, onClose }: Readonly<MegaMenuPanelProps>): ReactElement {
  const { categories, categoriesLoading } = useCategory();
  const [activeMainId, setActiveMainId] = useState<CategoryId | null>(null);
  const [activeSubId, setActiveSubId] = useState<SubCategoryId | null>(null);

  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    setActiveMainId((currentActiveId) => {
      const currentCategoryExists = categories.some(
        (category) => category.id === currentActiveId
      );

      if (currentCategoryExists) return currentActiveId;
      return categories[0]?.id ?? null;
    });
  }, [categories, isOpen]);

  const activeCategory = useMemo<Category | null>(
    () => categories.find((category) => category.id === activeMainId) ?? categories[0] ?? null,
    [categories, activeMainId]
  );

  const subCategories = useMemo(
    () => activeCategory?.children ?? [],
    [activeCategory]
  );

  useEffect(() => {
    if (!isOpen) return;

    setActiveSubId((currentActiveId) => {
      const currentSubExists = subCategories.some(
        (subCategory) => subCategory.id === currentActiveId
      );

      if (currentSubExists) return currentActiveId;
      return subCategories[0]?.id ?? null;
    });
  }, [subCategories, isOpen]);

  const activeSubCategory = useMemo<SubCategory | null>(
    () =>
      subCategories.find((subCategory) => subCategory.id === activeSubId) ??
      subCategories[0] ??
      null,
    [subCategories, activeSubId]
  );

  const handleSelectMainCategory = (categoryId: CategoryId): void => {
    setActiveMainId(categoryId);
    setActiveSubId(null);
  };

  return (
    <>
      <MegaMenuBackdrop isOpen={isOpen} onClose={onClose} />

      <MegaMenuDrawer isOpen={isOpen}>
        <CategorySidebar
          categories={categories}
          categoriesLoading={categoriesLoading}
          activeMainId={activeMainId}
          onClose={onClose}
          onSelectCategory={handleSelectMainCategory}
        />

        <SubCategorySidebar
          subCategories={subCategories}
          activeSubId={activeSubId}
          activeCategory={activeCategory}
          onClose={onClose}
          onSelectSubCategory={setActiveSubId}
        />

        <ActiveSubCategoryPanel
          activeSubCategory={activeSubCategory}
          activeSubId={activeSubId}
          onClose={onClose}
        />
      </MegaMenuDrawer>
    </>
  );
}

function useEscapeKey(isEnabled: boolean, onEscape: CloseMenuHandler): void {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onEscape();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnabled, onEscape]);
}
