"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { useMainCategories } from "@/hooks/useMainCategories";
import { useHeaderScrollState } from "@/hooks/useHeaderScrollState";
import {
  toCategoryFlyoutModel,
  toNavMainCategories,
  type CategoryFlyoutModel,
  type NavMainCategory,
} from "@/lib/adapters/navCategory";
import HeaderCategoryMegaMenu from "@/components/layout/header/HeaderCategoryMegaMenu";
import HeaderMobileMenu from "@/components/layout/header/HeaderMobileMenu";
import { HeaderTopBar } from "@/components/layout/header/HeaderTopBar";
import { HeaderMainBar } from "@/components/layout/header/HeaderMainBar";
import { HeaderTabletNav } from "@/components/layout/header/HeaderTabletNav";
import { HeaderBottomNav } from "@/components/layout/header/HeaderBottomNav";
import { cn } from "@/lib/utils";

type HeaderUiState = Readonly<{
  scrolled: boolean;
  mobileMenuOpen: boolean;
}>;

type HeaderNavModel = Readonly<{
  navCategories: NavMainCategory[];
  flyout: CategoryFlyoutModel;
  categoriesLoading: boolean;
}>;

function useHeaderUiState(): HeaderUiState & {
  setMobileMenuOpen: (open: boolean) => void;
} {
  const { scrolled } = useHeaderScrollState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return {
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
  };
}

function useHeaderNavModel(): HeaderNavModel {
  const { mainCategories, mainCategoriesLoading } = useMainCategories();

  const navCategories = useMemo(
    () => toNavMainCategories(mainCategories),
    [mainCategories],
  );

  const flyout = useMemo(
    () => toCategoryFlyoutModel(mainCategories),
    [mainCategories],
  );

  return {
    navCategories,
    flyout,
    categoriesLoading: mainCategoriesLoading,
  };
}

export default function Header(): ReactElement {
  const { scrolled, mobileMenuOpen, setMobileMenuOpen } = useHeaderUiState();
  const { navCategories, flyout, categoriesLoading } = useHeaderNavModel();

  const openMobileMenu = useCallback((): void => {
    setMobileMenuOpen(true);
  }, [setMobileMenuOpen]);

  const closeMobileMenu = useCallback((): void => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "bg-card/95 shadow-lg backdrop-blur-md" : "bg-card",
        )}
      >
        <HeaderTopBar />
        <HeaderMainBar onOpenMobileMenu={openMobileMenu} />
        <HeaderTabletNav onOpenCategories={openMobileMenu} />
        <HeaderCategoryMegaMenu
          flyout={flyout}
          isLoading={categoriesLoading}
        />
      </header>

      <HeaderBottomNav
        onOpenCategories={openMobileMenu}
        categoriesOpen={mobileMenuOpen}
      />

      <HeaderMobileMenu
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        categories={navCategories}
        flyout={flyout}
        isLoading={categoriesLoading}
      />

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
