"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface QuickAddButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const QuickAddButton: React.FC<QuickAddButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={t("productCard.quickAdd")}
      className="
        h-10 w-full
        rounded-none
        border-0
        bg-white
        text-[12px] font-medium text-black
        shadow-none
        hover:bg-[#F7F7F7]
        focus-visible:ring-0 focus-visible:ring-offset-0
      "
    >
      {t("productCard.quickAdd")}
    </Button>
  );
};

export default QuickAddButton;
