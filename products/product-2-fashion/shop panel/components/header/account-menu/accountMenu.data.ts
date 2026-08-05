import type { LucideIcon } from "lucide-react";
import { FileText, LogOut, MapPin, ShoppingCart, User } from "lucide-react";

export type AccountMenuItem = {
  key: "account" | "orders" | "address" | "my-reports" | "submit-report" | "logout";
  label: string;
  href?: string;
  icon: LucideIcon;
  destructive?: boolean;
};

/** Static key definitions — labels are resolved dynamically via useTranslation in AccountMenu */
export const ACCOUNT_MENU_KEYS: Omit<AccountMenuItem, "label">[] = [
  { key: "account",       href: "/account",             icon: User       },
  { key: "orders",        href: "/account/orders",       icon: ShoppingCart },
  { key: "address",       href: "/account/address",      icon: MapPin     },
  { key: "my-reports",    href: "/account/my-reports",   icon: FileText   },
  { key: "logout",                                       icon: LogOut, destructive: true },
];

/** @deprecated Use ACCOUNT_MENU_KEYS with useTranslation instead */
export const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { key: "account", label: "My Account", href: "/account", icon: User },
  {
    key: "orders",
    label: "My Order",
    href: "/account/orders",
    icon: ShoppingCart,
  },
  {
    key: "address",
    label: "Address & Delivery",
    href: "/account/address",
    icon: MapPin,
  },
  { key: "logout", label: "Log out", icon: LogOut, destructive: true },
];
