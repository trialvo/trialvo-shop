"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { FiChevronLeft, FiX } from "react-icons/fi";

type Props = {
  title: string;
  canGoBack: boolean;
  onBack?: () => void;
  onClose: () => void;
};

const MenuTopBar: React.FC<Props> = ({ title, canGoBack, onBack, onClose }) => {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5">
      <div className="flex items-center gap-3">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className={cn(
              "grid h-9 w-9 place-items-center cursor-pointer",
              "text-black hover:bg-black/5",
            )}
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-0" />
        )}

        <div className="text-lg font-bold text-black">{title}</div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={cn("grid h-9 w-9 place-items-center cursor-pointer", "text-black hover:bg-black/5")}
      >
        <FiX className="h-5 w-5" />
      </button>
    </div>
  );
};

export default MenuTopBar;
