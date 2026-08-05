"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiMenu, FiX } from "react-icons/fi";

type Props = {
  onClose: () => void;
  className?: string;
};

const FilterHeader: React.FC<Props> = ({ onClose, className }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "h-14 border-b border-black/10 bg-white px-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center text-black" aria-hidden="true">
          <FiMenu className="h-6 w-6" />
        </span>
        <span className="text-lg font-semibold text-black">Filters</span>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        className={cn(
          "h-10 w-10 rounded-none p-0 text-black shadow-none",
          "hover:bg-black/5 focus-visible:ring-0 focus-visible:ring-offset-0",
        )}
        aria-label="Close filters"
      >
        <FiX className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default FilterHeader;
