"use client";

import React from "react";
import type { DrawerEntryProps } from "../Types";
import MenuDrawer from "./MenuDrawer";
import type { MenuNode } from "./menu.types";

type MenuDrawerPayload = {
  initialNodes?: MenuNode[];
};

const MenuDrawerEntry: React.FC<DrawerEntryProps> = ({
  isTop,
  zIndex,
  payload,
  open,
  onOpenChange,
}) => {
  const _data = payload as MenuDrawerPayload | undefined;

  return (
    <MenuDrawer
      open={open}
      isTop={isTop}
      zIndex={zIndex}
      onOpenChange={onOpenChange}
    />
  );
};

export default MenuDrawerEntry;
