import ImageWithFallback from "@/components/common/ImageWithFallback";
import { cn, toPublicUrl } from "@/lib/utils";
import React from "react";
import { CiImageOff } from "react-icons/ci";

type Props = {
  src: string | undefined;
  alt: string;
  isActive?: boolean;
}

const CartItemImage: React.FC<Props> = ({ src, alt, isActive = false }) => {
  return (
    <div className={cn("relative h-22.5 w-22.5 shrink-0 overflow-hidden border transition-colors duration-200",
      isActive ? "border-[#636363]" : "border-[#F1F1F1]"
    )}>
      {
        src ? (
          <ImageWithFallback
            src={toPublicUrl(src) || ""}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (<div className="flex h-full w-full items-center justify-center">
          <CiImageOff className="h-6 w-6 text-foreground/50" />
        </div>)
      }
    </div>
  )
}

export default CartItemImage
