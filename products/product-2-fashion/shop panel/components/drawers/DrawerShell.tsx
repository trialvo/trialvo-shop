"use client";

import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop: boolean;
  zIndex?: number;
  side?: "left" | "right";
  a11yTitle?: string;
  overlayClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

const DrawerShell: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop,
  zIndex,
  side = "right",
  a11yTitle = "Drawer",
  overlayClassName,
  contentClassName,
  children,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={isTop} direction={side} handleOnly>
      <DrawerPortal forceMount>
        {isTop ? (
          <DrawerOverlay
            style={{ zIndex }}
            className={cn("bg-black/35", overlayClassName)}
          />
        ) : null}

        <DrawerContent
          style={{ zIndex: (zIndex ?? 50) + 1 }}
          className={cn(
            "mt-0 rounded-none border border-[#EDEDED] bg-white p-0",
            "shadow-[0_8px_40px_rgba(0,0,0,0.12)]",

            "w-[86vw] max-w-120",

            "max-[500px]:w-[calc(100dvw - 20%)] max-[500px]:max-w-[calc(100dvw - 20%)]",

            contentClassName
          )}
        >
          <DrawerTitle className="sr-only">{a11yTitle}</DrawerTitle>
          {children}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};

export default DrawerShell;
