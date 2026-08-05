import React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

type Props = {
  quantity: number;
  max?: number;
  onIncrease?: () => void;
  onDecrease?: () => void;
};

const ItemQuantity: React.FC<Props> = ({ quantity, max, onIncrease, onDecrease }) => {
  const isMin = quantity <= 1;
  const maxQuantity = typeof max === "number" && Number.isFinite(max) ? Math.max(1, max) : 5;
  const isMax = quantity >= maxQuantity;

  return (
    <div className="flex w-[100px] items-center border border-[#999999]">
      <button
        type="button"
        onClick={isMin ? undefined : onDecrease}
        disabled={isMin}
        className={`flex items-center justify-center text-xl font-medium p-2.25 ${isMin ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        aria-label="Decrease quantity"
      >
        <FiMinus className={`h-4.5 w-4.5 ${isMin ? "text-[#6A6678]/60" : "text-[#6A6678]"}`} />
      </button>

      <span className="min-w-7 text-center text-sm font-medium">
        {String(quantity).padStart(2, "0")}
      </span>

      <button
        type="button"
        onClick={isMax ? undefined : onIncrease}
        disabled={isMax}
        className={`flex items-center justify-center text-xl font-medium p-2.25 ${isMax ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        aria-label="Increase quantity"
      >
        <FiPlus className={`h-4.5 w-4.5 ${isMax ? "text-[#6A6678]/60" : "text-[#6A6678]"}`} />
      </button>
    </div>
  );
};

export default ItemQuantity;
