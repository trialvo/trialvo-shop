"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiX } from "react-icons/fi";

type Props = {
  onClose: () => void;
  className?: string;
};

const FilterHeader: React.FC<Props> = ({ onClose, className }) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-2",
        className,
      )}
    >
      <h2 className="px-2 text-base font-semibold text-black">{t("catalog.filters")}</h2>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.close")}
        className="grid h-10 w-10 place-items-center text-black hover:bg-black/5"
      >
        <FiX className="h-5 w-5" />
      </button>
    </div>
  );
};

export default FilterHeader;
