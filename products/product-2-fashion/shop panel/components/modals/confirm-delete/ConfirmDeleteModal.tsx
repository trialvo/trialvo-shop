"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";

export type ConfirmModalIntent = "delete" | "confirm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;

  cancelText?: string;
  confirmText?: string;
  intent?: ConfirmModalIntent;

  onConfirm?: () => void;
  confirming?: boolean;

  isTop?: boolean;
  zIndex?: number;
  className?: string;
};

export function inferConfirmIntent(
  title?: string,
  confirmText?: string,
  intent?: ConfirmModalIntent,
): ConfirmModalIntent {
  if (intent) return intent;
  const hay = `${title ?? ""} ${confirmText ?? ""}`.toLowerCase();
  if (/(cancel|clear)/.test(hay)) return "confirm";
  return "delete";
}

const ConfirmDeleteModal: React.FC<Props> = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText,
  confirmText,
  intent,
  onConfirm,
  confirming = false,
  isTop = true,
  zIndex = 80,
  className,
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("checkout.deleteAddressTitle");
  const resolvedDescription = description ?? t("checkout.deleteAddressDesc");
  const resolvedCancelText = cancelText ?? t("checkout.notNow");
  const resolvedConfirmText = confirmText ?? t("checkout.yesDelete");
  const resolvedIntent = inferConfirmIntent(resolvedTitle, resolvedConfirmText, intent);
  const isDelete = resolvedIntent === "delete";

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      title={resolvedTitle}
      icon={
        isDelete ? (
          <FiTrash2 className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <FiAlertTriangle className="h-4 w-4" strokeWidth={1.75} />
        )
      }
      contentClassName={cn("max-w-[440px]", className)}
      bodyClassName="px-5 py-4"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={confirming}
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-[4px] border-[#E5E5E5] px-4 text-sm font-medium text-black hover:border-black hover:bg-white"
          >
            {resolvedCancelText}
          </Button>
          <Button
            type="button"
            disabled={confirming}
            onClick={() => {
              onConfirm?.();
            }}
            className="h-10 rounded-[4px] bg-black px-4 text-sm font-medium text-white hover:bg-black/90"
          >
            {resolvedConfirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-black/55">{resolvedDescription}</p>
    </ModalShell>
  );
};

export default ConfirmDeleteModal;
