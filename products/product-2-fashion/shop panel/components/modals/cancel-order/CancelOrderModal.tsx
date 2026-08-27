"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiAlertTriangle } from "react-icons/fi";

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
      title={resolvedTitle}
      icon={<FiAlertTriangle className="h-4 w-4" strokeWidth={1.75} />}
      contentClassName={cn("max-w-[440px]", className)}
      bodyClassName="px-5 py-4"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[4px] border-[#E5E5E5] px-4 text-sm font-medium text-black hover:border-black hover:bg-white"
            onClick={() => onOpenChange(false)}
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            className="h-10 rounded-[4px] bg-black px-4 text-sm font-medium text-white hover:bg-black/90"
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            {resolvedConfirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-black/55">{resolvedDescription}</p>
    </ModalShell>
  );
};

export default CancelOrderModal;
