import type { Category, ChildCategory, SubCategory } from "@/hooks/useCategory";
import type { ReactNode } from "react";

export type CategoryId = Category["id"];
export type SubCategoryId = SubCategory["id"];
export type CategoryImagePath = string | null | undefined;
export type CloseMenuHandler = () => void;
export type SelectMainCategoryHandler = (categoryId: CategoryId) => void;
export type SelectSubCategoryHandler = (subCategoryId: SubCategoryId) => void;

export interface MegaMenuPanelProps {
  isOpen: boolean;
  onClose: CloseMenuHandler;
}

export interface MegaMenuBackdropProps {
  isOpen: boolean;
  onClose: CloseMenuHandler;
}

export interface MegaMenuDrawerProps {
  isOpen: boolean;
  children: ReactNode;
}

export interface CategorySidebarProps {
  categories: ReadonlyArray<Category>;
  categoriesLoading: boolean;
  activeMainId: CategoryId | null;
  onClose: CloseMenuHandler;
  onSelectCategory: SelectMainCategoryHandler;
}

export interface CategoryListProps {
  categories: ReadonlyArray<Category>;
  isLoading: boolean;
  activeMainId: CategoryId | null;
  onSelectCategory: SelectMainCategoryHandler;
}

export interface MainCategoryItemsProps {
  categories: ReadonlyArray<Category>;
  activeMainId: CategoryId | null;
  onSelectCategory: SelectMainCategoryHandler;
}

export interface CategoryNavItemProps {
  category: Category;
  isActive: boolean;
  onSelectCategory: SelectMainCategoryHandler;
}

export interface CloseActionProps {
  onClose: CloseMenuHandler;
}

export interface SubCategorySidebarProps {
  subCategories: ReadonlyArray<SubCategory>;
  activeSubId: SubCategoryId | null;
  activeCategory: Category | null;
  onClose: CloseMenuHandler;
  onSelectSubCategory: SelectSubCategoryHandler;
}

export interface SubCategoryListProps {
  subCategories: ReadonlyArray<SubCategory>;
  activeSubId: SubCategoryId | null;
  onSelectSubCategory: SelectSubCategoryHandler;
}

export interface SubCategoryItemsProps {
  subCategories: ReadonlyArray<SubCategory>;
  activeSubId: SubCategoryId | null;
  onSelectSubCategory: SelectSubCategoryHandler;
}

export interface SubCategoryNavItemProps {
  subCategory: SubCategory;
  isActive: boolean;
  onSelectSubCategory: SelectSubCategoryHandler;
}

export interface ActiveCategoryPanelProps {
  activeCategory: Category | null;
  activeMainId: CategoryId | null;
  onClose: CloseMenuHandler;
}

export interface ActiveSubCategoryPanelProps {
  activeSubCategory: SubCategory | null;
  activeSubId: SubCategoryId | null;
  onClose: CloseMenuHandler;
}

export interface CategoryPanelHeaderProps {
  category: Category;
  onClose: CloseMenuHandler;
}

export interface SubCategoryPanelHeaderProps {
  subCategory: SubCategory;
  onClose: CloseMenuHandler;
}

export interface SubCategoryGridProps {
  subCategories: ReadonlyArray<SubCategory>;
  onClose: CloseMenuHandler;
}

export interface SubCategoryGroupProps {
  subCategory: SubCategory;
  onClose: CloseMenuHandler;
}

export interface ChildCategoryGridProps {
  childCategories: ReadonlyArray<ChildCategory>;
  onClose: CloseMenuHandler;
}

export interface ChildCategoryListProps {
  childCategories: ReadonlyArray<ChildCategory>;
  onClose: CloseMenuHandler;
}

export interface ChildCategoryLinkProps {
  childCategory: ChildCategory;
  onClose: CloseMenuHandler;
}

export interface CategoryImageProps {
  imagePath: string;
  alt: string;
  className: string;
}
