"use client";

import SignInCard from "@/components/auth/SignInCard";
import ModalShell from "@/components/modals/ModalShell";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiX } from "react-icons/fi";

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
      contentClassName={cn(
        "overflow-hidden p-0",
        "w-[calc(100vw-32px)] max-w-[440px]",
        "max-h-[min(640px,90dvh)]",
        "rounded-[4px] border-[#E5E5E5]",
        contentClassName,
      )}
    >
      <div className="flex max-h-[min(640px,90dvh)] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-tight text-black">
            {t("auth.signInTitle")}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
            className="grid h-8 w-8 place-items-center text-black/55 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SignInCard
            forgotHref={forgotHref}
            createHref={createHref}
            onNavigate={onOpenChange}
            hideTitle
            className="px-5 py-5"
            shadowClass="shadow-none"
            redirectToCheckout={true}
          />
        </div>
      </div>
    </ModalShell>
  );
};

export default SignInModal;
