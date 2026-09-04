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
      // Above the "Stay in the loop" push banner (z≈55)
      zIndex={110}
      onOpenChange={onOpenChange}
    />
  );
};

export default NotificationDrawerEntry;
