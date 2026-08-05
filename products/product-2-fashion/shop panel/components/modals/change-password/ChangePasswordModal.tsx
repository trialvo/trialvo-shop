"use client";

import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiX } from "react-icons/fi";

import ChangePasswordForm from "@/components/account/change-password/ChangePasswordForm";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  open: boolean;
  isTop: boolean;
  zIndex: number;
  onOpenChange: (open: boolean) => void;
};

const ChangePasswordModal: React.FC<Props> = ({ open, isTop, zIndex, onOpenChange }) => {
  const { t } = useTranslation();
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      contentClassName={cn(
        "p-0",
        "w-auto max-w-none sm:w-[720px]",
        "left-4 right-4 translate-x-0 sm:left-[50%] sm:right-auto sm:-translate-x-1/2",
      )}
    >
      <div className="relative flex h-full flex-col bg-white">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-black/10 bg-white px-4 py-2 sm:hidden">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute -right-3 -top-3 h-8 w-8 rounded-none bg-black p-0 text-white sm:inline-flex"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </Button>

          <div className="flex-1 text-left text-lg font-semibold text-black">{t("account.changePassword.setPasswordTitle")}</div>
        </div>

        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute -right-5 -top-5 z-20 h-10 w-10 hidden rounded-none bg-black p-0 text-white sm:inline-flex"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </Button>

        <div className="flex-1 overflow-y-auto px-2.5 py-4 sm:p-6">
          <div className="space-y-3">
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold text-black">{t("account.changePassword.changePasswordTitle")}</h2>
              <p className="text-sm text-black/70">
                {t("account.changePassword.securityNote")}
              </p>
            </div>

            <ChangePasswordForm onNavigate={onOpenChange} />
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default ChangePasswordModal;
