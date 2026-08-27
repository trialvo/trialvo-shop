"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { FiX } from "react-icons/fi";

import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop: boolean;
  zIndex: number;
  contentClassName?: string;
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
  showHeader?: boolean;
  bodyClassName?: string;
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
  icon,
  footer,
  showClose = true,
  showHeader,
  bodyClassName,
  closeOnOutsideClick = true,
}) => {
  const { t } = useTranslation();
  const headerVisible = showHeader ?? (Boolean(title && title !== "Dialog") || Boolean(icon));

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
            "w-[calc(100vw-32px)] max-w-lg",
            "overflow-hidden p-0 rounded-[4px] border border-[#E5E5E5] bg-white",
            "transition-[opacity,transform] duration-200 focus:outline-none",
            "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
            "data-[state=closed]:scale-[0.98] data-[state=open]:scale-100",
            contentClassName,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          <div className="flex max-h-[min(90dvh,760px)] flex-col bg-white">
            {headerVisible ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E5E5E5] px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  {icon ? (
                    <span
                      aria-hidden
                      className="grid h-9 w-9 shrink-0 place-items-center border border-[#E5E5E5] text-black"
                    >
                      {icon}
                    </span>
                  ) : null}
                  {title && title !== "Dialog" ? (
                    <h2 className="truncate text-[15px] font-semibold tracking-tight text-black">
                      {title}
                    </h2>
                  ) : null}
                </div>

                {showClose ? (
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label={t("common.close")}
                    className="grid h-8 w-8 shrink-0 place-items-center text-black/55 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>
              {children}
            </div>

            {footer ? (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#E5E5E5] px-5 py-3.5">
                {footer}
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ModalShell;
