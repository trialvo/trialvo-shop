import ImageWithFallback from "@/components/common/ImageWithFallback";
import * as React from "react";
import type { SizeChartImage } from "./types";

type Props = {
  image?: SizeChartImage;
};

const SizeChartSection: React.FC<Props> = ({ image }) => {
  if (!image?.src) return null;

  const width = image.width ?? 1200;
  const height = image.height ?? 655;

  return (
    <section className="w-full pt-8">
      <div className="flex justify-center">
        <div className="relative overflow-hidden border border-[#E5E5E5] bg-white">
          <ImageWithFallback
            src={image.src}
            alt={image.alt}
            width={width}
            height={height}
            className={`${height ? `h-[${height}px]` : "h-auto"} w-full object-contain`}
            preload={false}
          />
        </div>
      </div>
    </section>
  );
};

export default SizeChartSection;
