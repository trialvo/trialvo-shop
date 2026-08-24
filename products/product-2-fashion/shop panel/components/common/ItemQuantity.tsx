import React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";
import { cn } from "@/lib/utils";

type Props = {
  quantity: number;
  max?: number;
  onIncrease?: () => void;
  onDecrease?: () => void;
  className?: string;
};

const ItemQuantity: React.FC<Props> = ({
  quantity,
  max,
  onIncrease,
  onDecrease,
  className,
}) => {
  const isMin = quantity <= 1;
  const maxQuantity = typeof max === "number" && Number.isFinite(max) ? Math.max(1, max) : 5;
  const isMax = quantity >= maxQuantity;

  return (
    <div
      className={cn(
        "flex w-[100px] items-center overflow-hidden border border-[#999999]",
        className,
      )}
    >
      <button
        type="button"
        onClick={isMin ? undefined : onDecrease}
        disabled={isMin}
        className={cn(
          "flex flex-1 items-center justify-center p-2.5 text-xl font-medium",
          isMin ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
        aria-label="Decrease quantity"
      >
        <FiMinus
          className={cn("h-4 w-4", isMin ? "text-black/30" : "text-[#191919]")}
          strokeWidth={1.75}
        />
      </button>

      <span className="min-w-7 text-center text-sm font-semibold tabular-nums text-[#191919]">
        {String(quantity).padStart(2, "0")}
      </span>

      <button
        type="button"
        onClick={isMax ? undefined : onIncrease}
        disabled={isMax}
        className={cn(
          "flex flex-1 items-center justify-center p-2.5 text-xl font-medium",
          isMax ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
        aria-label="Increase quantity"
      >
        <FiPlus
          className={cn("h-4 w-4", isMax ? "text-black/30" : "text-[#191919]")}
          strokeWidth={1.75}
        />
      </button>
    </div>
  );
};

export default ItemQuantity;
