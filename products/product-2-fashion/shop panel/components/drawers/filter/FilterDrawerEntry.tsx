"use client";

import DrawerShell from "@/components/drawers/DrawerShell";
import { useAppDispatch } from "@/redux/hooks";
import { closeDrawerById } from "@/redux/slices/drawerManagerSlice";
import * as React from "react";
import type { DrawerEntryProps } from "../Types";
import FilterDrawer from "./FilterDrawer";

const FilterDrawerEntry: React.FC<DrawerEntryProps> = ({
  drawerId,
  open,
  onOpenChange,
  isTop,
  zIndex,
}) => {
  const dispatch = useAppDispatch();
  const closeTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        globalThis.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DrawerShell
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          if (closeTimeoutRef.current) {
            globalThis.clearTimeout(closeTimeoutRef.current);
          }
          closeTimeoutRef.current = window.setTimeout(() => {
            dispatch(closeDrawerById(drawerId));
          }, 300);
        }
      }}
      a11yTitle="Filter Products"
      isTop={isTop}
      zIndex={50}
      side="left"
      contentClassName="w-[86vw] max-w-[360px] rounded-none border-r border-[#E5E5E5] p-0"
    >
      <FilterDrawer
        open={open}
        onOpenChange={onOpenChange}
      />
    </DrawerShell>
  );
};

export default FilterDrawerEntry;
