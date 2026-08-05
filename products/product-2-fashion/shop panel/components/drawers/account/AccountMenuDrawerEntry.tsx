"use client";

import { useAppDispatch } from "@/redux/hooks";
import { closeDrawerById } from "@/redux/slices/drawerManagerSlice";
import * as React from "react";
import DrawerShell from "../DrawerShell";
import type { DrawerEntryProps } from "../Types";
import AccountMenuDrawer from "./AccountMenuDrawer";

const AccountMenuDrawerEntry: React.FC<DrawerEntryProps> = ({ drawerId, isTop, zIndex }) => {
  const dispatch = useAppDispatch();

  return (
    <DrawerShell
      open
      isTop={isTop}
      zIndex={zIndex}
      side="left"
      a11yTitle="Account Menu"
      onOpenChange={(v) => {
        if (!v) dispatch(closeDrawerById(drawerId));
      }}
    >
      <AccountMenuDrawer
        onClose={() => dispatch(closeDrawerById(drawerId))}
      />
    </DrawerShell>
  );
};

export default AccountMenuDrawerEntry;
