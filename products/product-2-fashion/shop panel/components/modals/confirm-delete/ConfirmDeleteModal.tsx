"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";

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
      contentClassName={cn(
        "w-[calc(100vw-24px)] max-w-[560px]",
        "p-0",
        className,
      )}
    >
      <div className="p-7">
        <h3 className="text-lg font-semibold text-black">{resolvedTitle}</h3>

        <p className="mt-3 max-w-110 text-sm leading-5 text-black/60">
          {resolvedDescription}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-none border-[#BDBDBD] px-6 text-sm font-medium text-black"
          >
            {resolvedCancelText}
          </Button>

          <Button
            type="button"
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            className="h-10 rounded-none bg-black px-6 text-sm font-medium text-white hover:bg-black/90"
          >
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConfirmDeleteModal;
