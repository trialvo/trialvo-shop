"use client";

import SignInCard from "@/components/auth/SignInCard";
import ModalShell from "@/components/modals/ModalShell";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiLogIn } from "react-icons/fi";

type Props = {
  open: boolean;
  isTop: boolean;
  zIndex: number;
  onOpenChange: (open: boolean) => void;

  forgotHref?: string;
  createHref?: string;

  contentClassName?: string;
};

const SignInModal: React.FC<Props> = ({
  open,
  isTop,
  zIndex,
  onOpenChange,
  forgotHref,
  createHref,
  contentClassName,
}) => {
  const { t } = useTranslation();
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      title={t("auth.signInTitle")}
      icon={<FiLogIn className="h-4 w-4" strokeWidth={1.75} />}
      contentClassName={cn("max-w-[440px]", contentClassName)}
    >
      <SignInCard
        forgotHref={forgotHref}
        createHref={createHref}
        onNavigate={onOpenChange}
        hideTitle
        className="px-5 py-5"
        shadowClass="shadow-none"
        redirectToCheckout={true}
      />
    </ModalShell>
  );
};

export default SignInModal;
