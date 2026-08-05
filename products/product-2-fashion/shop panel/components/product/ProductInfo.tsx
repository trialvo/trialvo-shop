import * as React from "react";
import StarRating from "@/components/review/StarRating";

interface ProductInfoProps {
  title: string;
  price: number;
  oldPrice?: number;
  avgRating?: number;
  reviewCount?: number;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ title, price, oldPrice, avgRating = 0, reviewCount = 0 }) => {
  return (
    <div className="mt-3">
      <h4
        className="
          relative inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap
          text-sm max-[501px]:text-xs font-medium
          after:absolute after:left-0 after:bottom-0
          after:h-px after:w-full after:bg-black
          after:origin-left after:scale-x-0
          after:transition-transform after:duration-300 after:ease-out
          group-hover:after:scale-x-100
        "
      >
        {title}
      </h4>

      {reviewCount > 0 && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <StarRating rating={avgRating} size={12} />
          <span className="text-[10px] text-gray-400 font-medium">{avgRating.toFixed(1)} ({reviewCount})</span>
        </div>
      )}

      <div className="flex items-baseline gap-1.5">
        <div className="text-base max-[501px]:text-xs font-semibold">
          BDT {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>

        {typeof oldPrice === "number" && oldPrice > price ? (
          <div className="text-xs max-[501px]:text-[10px] text-[#888888] line-through">
            {oldPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductInfo;
