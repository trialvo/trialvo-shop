"use client";

import React from "react";
import type { DrawerEntryProps } from "../Types";
import NotificationDrawer from "./NotificationDrawer";

const NotificationDrawerEntry: React.FC<DrawerEntryProps> = ({
  isTop,
  open,
  onOpenChange,
}) => {
  return (
    <NotificationDrawer
      open={open}
      isTop={isTop}
      zIndex={60}
      onOpenChange={onOpenChange}
    />
  );
};

export default NotificationDrawerEntry;
