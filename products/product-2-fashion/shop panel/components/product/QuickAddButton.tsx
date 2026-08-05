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
        h-12 w-full
        rounded-none
        border border-[#999999]
        bg-white
        text-black
        shadow-none
        hover:bg-white
        focus-visible:ring-0 focus-visible:ring-offset-0
      "
    >
      {t("productCard.quickAdd")}
    </Button>
  );
};

export default QuickAddButton;
