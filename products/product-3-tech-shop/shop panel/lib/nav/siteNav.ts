import type { LucideIcon } from "lucide-react";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";

/** Desktop category-bar links (All Categories button stays separate). */
export type DesktopNavLink = Readonly<{
  id: string;
  href: string;
  label: string;
  /** Accent styling (e.g. Hot Deals). */
  accent?: boolean;
}>;

export const DESKTOP_PRIMARY_LINKS: readonly DesktopNavLink[] = [
  { id: "home", href: "/", label: "Home" },
  { id: "shop", href: "/shop", label: "Shop" },
  {
    id: "hot-deals",
    href: "/shop?badge=sale",
    label: "Hot Deals",
    accent: true,
  },
  { id: "new-arrivals", href: "/shop?badge=new", label: "New Arrivals" },
  {
    id: "best-sellers",
    href: "/shop?badge=bestseller",
    label: "Best Sellers",
  },
  { id: "about", href: "/about", label: "About" },
  { id: "contact", href: "/contact", label: "Contact" },
] as const;

export type BottomNavAction = "categories" | "cart";

export type BottomNavLinkItem = Readonly<{
  id: string;
  kind: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  /** Returns true when this tab should look active. */
  isActive: (pathname: string) => boolean;
}>;

export type BottomNavActionItem = Readonly<{
  id: string;
  kind: "action";
  action: BottomNavAction;
  label: string;
  icon: LucideIcon;
}>;

export type BottomNavItem = BottomNavLinkItem | BottomNavActionItem;

/**
 * Mobile bottom navigation — five thumb-friendly destinations.
 * Categories / Cart are actions (open sheet / drawer).
 */
export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    id: "home",
    kind: "link",
    href: "/",
    label: "Home",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    id: "shop",
    kind: "link",
    href: "/shop",
    label: "Shop",
    icon: ShoppingBag,
    isActive: (pathname) =>
      pathname === "/shop" || pathname.startsWith("/shop/"),
  },
  {
    id: "categories",
    kind: "action",
    action: "categories",
    label: "Categories",
    icon: LayoutGrid,
  },
  {
    id: "account",
    kind: "link",
    href: "/account",
    label: "Account",
    icon: User,
    isActive: (pathname) =>
      pathname === "/account" || pathname.startsWith("/account/"),
  },
  {
    id: "cart",
    kind: "action",
    action: "cart",
    label: "Cart",
    icon: ShoppingCart,
  },
] as const;
