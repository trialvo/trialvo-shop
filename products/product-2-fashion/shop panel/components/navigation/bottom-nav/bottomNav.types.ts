import type { IconType } from "react-icons";

export type BottomNavKey = "home" | "shop" | "orders" | "account";

export type BottomNavItemConfig = {
  key: BottomNavKey;
  label: string;
  href: string;
  Icon: IconType;
  match?: (pathname: string) => boolean;
};
