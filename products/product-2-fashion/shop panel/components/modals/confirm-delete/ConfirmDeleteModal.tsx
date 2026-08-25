"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiX } from "react-icons/fi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;

  cancelText?: string;
  confirmText?: string;

  onConfirm?: () => void;

  isTop?: boolean;
  zIndex?: number;
  className?: string;
};

const ConfirmDeleteModal: React.FC<Props> = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText,
  confirmText,
  onConfirm,
  isTop = true,
  zIndex = 80,
  className,
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("checkout.deleteAddressTitle");
  const resolvedDescription = description ?? t("checkout.deleteAddressDesc");
  const resolvedCancelText = cancelText ?? t("checkout.notNow");
  const resolvedConfirmText = confirmText ?? t("checkout.yesDelete");
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      title={resolvedTitle}
      contentClassName={cn(
        "overflow-hidden p-0",
        "w-[calc(100vw-32px)] max-w-[440px]",
        "rounded-[4px] border-[#E5E5E5]",
        className,
      )}
    >
      <div className="bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E5E5] px-5 py-4">
          <h3 className="pr-2 text-[15px] font-semibold leading-snug tracking-tight text-black">
            {resolvedTitle}
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
            className="grid h-8 w-8 shrink-0 place-items-center text-black/55 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <p className="px-5 py-4 text-sm leading-relaxed text-black/55">
          {resolvedDescription}
        </p>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-5 py-3.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-[4px] border-[#E5E5E5] px-4 text-sm font-medium text-black hover:border-black hover:bg-white"
          >
            {resolvedCancelText}
          </Button>

          <Button
            type="button"
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            className="h-10 rounded-[4px] bg-black px-4 text-sm font-medium text-white hover:bg-black/90"
          >
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConfirmDeleteModal;
