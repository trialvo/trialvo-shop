import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  value: string;
  isSelected: boolean;
  isUnavailable?: boolean;
  onClick: () => void;
};

const SizeOption: React.FC<Props> = ({
  value,
  isSelected,
  isUnavailable = false,
  onClick,
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      title={isUnavailable ? "Not available for selected color" : undefined}
      className={cn(
        "relative h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition-colors duration-150",
        isSelected
          ? "border-[#191919] bg-[#191919] text-white hover:bg-[#191919] hover:text-white"
          : "border-[#D0D0D0] bg-white text-[#191919] hover:border-[#191919]",
        isUnavailable && !isSelected && "opacity-40",
      )}
    >
      {value}
      {isUnavailable && !isSelected ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="block h-px w-[130%] -rotate-45 bg-[#999]/80" />
          </span>
        </span>
      ) : null}
    </Button>
  );
};

export default SizeOption;
