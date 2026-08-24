import * as React from "react";
import StarRating from "@/components/review/StarRating";

interface ProductInfoProps {
  title: string;
  price: number;
  oldPrice?: number;
  avgRating?: number;
  reviewCount?: number;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  title,
  price,
  oldPrice,
  avgRating = 0,
  reviewCount = 0,
}) => {
  return (
    <div className="mt-2.5">
      <h4 className="max-w-full truncate text-sm font-medium text-[#191919] max-[501px]:text-xs">
        {title}
      </h4>

      {reviewCount > 0 ? (
        <div className="mt-0.5 flex items-center gap-1.5">
          <StarRating rating={avgRating} size={12} />
          <span className="text-[10px] font-medium text-black/40">
            {avgRating.toFixed(1)} ({reviewCount})
          </span>
        </div>
      ) : null}

      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-sm font-semibold text-[#191919] max-[501px]:text-xs">
          BDT {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>

        {typeof oldPrice === "number" && oldPrice > price ? (
          <div className="text-xs text-[#888888] line-through max-[501px]:text-[10px]">
            BDT {oldPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductInfo;
