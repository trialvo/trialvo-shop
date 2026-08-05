"use client";

import { FiGrid, FiHome, FiShoppingCart, FiUser } from "react-icons/fi";
import type { BottomNavItemConfig } from "./bottomNav.types";

// Labels are resolved at render time in BottomNavItem via useTranslation.
// The keys here act as translation key references.
export const BOTTOM_NAV_KEYS: Array<Omit<BottomNavItemConfig, "label"> & { tk: string }> = [
  {
    key: "home",
    tk: "bottomNav.home",
    href: "/",
    Icon: FiHome,
    match: (p) => p === "/",
  },
  {
    key: "shop",
    tk: "bottomNav.shop",
    href: "/category/all-products",
    Icon: FiShoppingCart,
    match: (p) => p.startsWith("/category") || p.startsWith("/products"),
  },
  {
    key: "orders",
    tk: "bottomNav.orders",
    href: "/account/orders",
    Icon: FiGrid,
    match: (p) => p.startsWith("/account/orders") || p.startsWith("/account/order"),
  },
  {
    key: "account",
    tk: "bottomNav.account",
    href: "/account",
    Icon: FiUser,
    match: (p) => p.startsWith("/account"),
  },
];

// Kept for backwards compatibility
export const BOTTOM_NAV_ITEMS: BottomNavItemConfig[] = [
  { key: "home", label: "Home", href: "/", Icon: FiHome, match: (p) => p === "/" },
  { key: "shop", label: "Shop", href: "/category/all-products", Icon: FiShoppingCart, match: (p) => p.startsWith("/category") || p.startsWith("/products") },
  { key: "orders", label: "My Orders", href: "/account/orders", Icon: FiGrid, match: (p) => p.startsWith("/account/orders") || p.startsWith("/account/order") },
  { key: "account", label: "Account", href: "/account", Icon: FiUser, match: (p) => p.startsWith("/account") },
];
