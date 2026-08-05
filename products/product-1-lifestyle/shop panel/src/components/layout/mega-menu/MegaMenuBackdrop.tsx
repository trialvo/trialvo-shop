"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import type { MegaMenuBackdropProps } from "./MegaMenuPanel.types";

export function MegaMenuBackdrop({
  isOpen,
  onClose,
}: Readonly<MegaMenuBackdropProps>): ReactElement {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
      aria-hidden
    />
  );
}
