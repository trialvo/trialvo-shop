"use client";

import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { FiChevronLeft, FiX } from "react-icons/fi";

type Props = {
  title: string;
  canGoBack: boolean;
  onBack?: () => void;
  onClose: () => void;
};

const iconBtnClass =
  "grid h-10 w-10 shrink-0 place-items-center text-black hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30";

const MenuTopBar: React.FC<Props> = ({ title, canGoBack, onBack, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#E5E5E5] px-2">
      <div className="flex min-w-0 items-center">
        {canGoBack ? (
          <button type="button" onClick={onBack} aria-label={t("common.back")} className={iconBtnClass}>
            <FiChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-2" />
        )}

        <h2 className="truncate px-2 text-base font-semibold text-black">{title}</h2>
      </div>

      <button type="button" onClick={onClose} aria-label={t("common.close")} className={iconBtnClass}>
        <FiX className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MenuTopBar;
