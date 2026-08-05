import Link from "next/link";
import React from "react";
import { FiArrowRight } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";

export type FeatureProductHeaderProps = {
  title?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  className?: string;
};

const FeatureProductHeader: React.FC<FeatureProductHeaderProps> = ({
  title,
  viewAllLabel,
  viewAllHref,
  className = "",
}) => {
  const { t } = useTranslation();

  const resolvedTitle = title ?? t("featureHeader.title");
  const resolvedViewAll = viewAllLabel ?? t("featureHeader.viewAll");

  return (
    <div className={`w-full mt-20 max-[501px]:mt-3 border-t border-[#F1F1F1] bg-white pt-3 pb-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 text-center">
        <h2 className="text-[28px] max-[501px]:text-[22px] font-semibold tracking-tight text-black">
          {resolvedTitle}
        </h2>

        {
          viewAllHref && (
            <div className="mt-2 flex items-center justify-center">
              <Link
                href={viewAllHref}
                className="group inline-flex items-center gap-3 text-[16px] font-medium text-black"
              >
                <span className="text-sm font-medium">{resolvedViewAll}</span>
                <span className="text-[22px] leading-none transition-transform duration-200 group-hover:translate-x-1">
                  <FiArrowRight className="text-black w-5 h-5" />
                </span>
              </Link>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default FeatureProductHeader;
