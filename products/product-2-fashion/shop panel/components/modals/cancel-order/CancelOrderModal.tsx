"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTop?: boolean;
  zIndex?: number;

  title?: string;
  description?: string;

  cancelLabel?: string;
  confirmLabel?: string;

  onConfirm?: () => void;

  className?: string;
};

const CancelOrderModal: React.FC<Props> = ({
  open,
  onOpenChange,
  isTop = true,
  zIndex = 60,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  className,
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("account.orders.cancelOrderTitle");
  const resolvedDescription = description ?? t("account.orders.cancelOrderDesc");
  const resolvedCancelLabel = cancelLabel ?? t("account.orders.notNow");
  const resolvedConfirmLabel = confirmLabel ?? t("account.orders.yesCancel");
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      contentClassName={cn(
        "w-[calc(100vw-24px)] max-w-[520px]",
        "p-0",
        className,
      )}
    >
      <div className="p-6">
        <h3 className="text-base font-semibold text-black">{resolvedTitle}</h3>
        <p className="mt-3 text-sm leading-5 text-black/70">{resolvedDescription}</p>

        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-none border-[#BDBDBD] px-6 text-sm font-medium text-black"
            onClick={() => onOpenChange(false)}
          >
            {resolvedCancelLabel}
          </Button>

          <Button
            type="button"
            className="h-10 rounded-none bg-black px-6 text-sm font-medium text-white hover:bg-black/90"
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};

export default CancelOrderModal;
