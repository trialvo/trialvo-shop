import type React from "react";
import type { Product } from "./product";

export interface QuickViewState {
  isOpen: boolean;
  productId: number | null;
  product: Product | null;
}

export type SortOption = "featured" | "az" | "za" | "price-asc" | "price-desc" | "newest" | "oldest";

export interface NavCategory {
  label: string;
  href: string;
  featured?: boolean;
  submenu?: string[];
  submenuHrefs?: string[];
}

export type ConfirmationVariant = "danger" | "warning" | "info";

/* ── Mega-Menu Types ──────────────────────────────────────────────── */

/** A single item in the right-panel grid */
export interface MegaMenuSubItem {
  label: string;
  href: string;
  /** Optional lucide-react icon component */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

/** A grouped section inside the right panel (e.g. "Tops", "Bottoms") */
export interface MegaMenuSubGroup {
  heading?: string;
  items: MegaMenuSubItem[];
}

/** Top-level category in the left sidebar */
export interface MegaMenuCategory {
  id: string;
  label: string;
  /** Lucide-react icon component for the sidebar row */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  /** Groups of sub-items shown in the right panel when this category is active */
  groups: MegaMenuSubGroup[];
}
