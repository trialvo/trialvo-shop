"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import type { MegaMenuDrawerProps } from "./MegaMenuPanel.types";

const DRAWER_WIDTH = "min(980px, 96vw)";

export function MegaMenuDrawer({
  isOpen,
  children,
}: Readonly<MegaMenuDrawerProps>): ReactElement {
  return (
    <div
      role="dialog"
      aria-label="All Categories"
      aria-modal="true"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed top-0 left-0 h-full z-[60] bg-background shadow-2xl flex transition-transform duration-300 ease-out",
        // Extra offset when closed so box-shadow does not bleed into the viewport
        isOpen ? "translate-x-0" : "-translate-x-[calc(100%+3rem)]"
      )}
      style={{ width: DRAWER_WIDTH }}
    >
      {children}
    </div>
  );
}
