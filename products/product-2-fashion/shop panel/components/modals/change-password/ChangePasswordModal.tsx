"use client";

import ChangePasswordForm from "@/components/account/change-password/ChangePasswordForm";
import ModalShell from "@/components/modals/ModalShell";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiLock } from "react-icons/fi";

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
      title={t("account.changePassword.changePasswordTitle")}
      icon={<FiLock className="h-4 w-4" strokeWidth={1.75} />}
      contentClassName={cn("max-w-[520px]")}
      bodyClassName="px-5 py-5"
    >
      <p className="mb-4 text-sm text-black/55">
        {t("account.changePassword.securityNote")}
      </p>
      <ChangePasswordForm onNavigate={onOpenChange} />
    </ModalShell>
  );
};

export default ChangePasswordModal;
