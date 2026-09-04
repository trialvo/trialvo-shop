"use client";

import type { DrawerKey } from "@/redux/slices/drawerManagerSlice";
import React from "react";
import AccountMenuDrawerEntry from "./account/AccountMenuDrawerEntry";
import CartDrawerEntry from "./cart/CartDrawerEntry";
import FilterDrawerEntry from "./filter/FilterDrawerEntry";
import MenuDrawerEntry from "./menu/MenuDrawerEntry";
import NotificationDrawerEntry from "./notifications/NotificationDrawerEntry";
import { DrawerEntryProps } from "./Types";

export const DRAWER_REGISTRY: Record<DrawerKey, React.FC<DrawerEntryProps>> = {
  cart: CartDrawerEntry,
  menu: MenuDrawerEntry,
  filters: FilterDrawerEntry,
  accountMenu: AccountMenuDrawerEntry,
  notifications: NotificationDrawerEntry,
};
