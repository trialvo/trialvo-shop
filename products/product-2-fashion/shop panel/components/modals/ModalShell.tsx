"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop: boolean;
  zIndex: number;
  contentClassName?: string;
  children: React.ReactNode;
  title?: string;

  closeOnOutsideClick?: boolean;
};

const ModalShell: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop,
  zIndex,
  contentClassName,
  children,
  title = "Dialog",
  closeOnOutsideClick = true,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={isTop}>
      <DialogPortal forceMount>
        {isTop ? (
          <DialogOverlay
            forceMount
            style={{ zIndex }}
            className="bg-black/35 transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
          />
        ) : null}

        <DialogPrimitive.Content
          forceMount
          style={{ zIndex: zIndex + 1 }}
          onPointerDownOutside={(e) => {
            if (!closeOnOutsideClick) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (!closeOnOutsideClick) e.preventDefault();
          }}
          className={cn(
            "fixed left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-lg",
            "p-0 rounded-none border border-[#EDEDED] bg-white",
            "shadow-[0_8px_40px_rgba(0,0,0,0.12)]",
            "transition-[opacity,transform] duration-200 focus:outline-none",
            "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
            "data-[state=closed]:scale-[0.98] data-[state=open]:scale-100",
            contentClassName,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ModalShell;
