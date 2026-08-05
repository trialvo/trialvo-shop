"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";

const FooterBottom: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex flex-col md:flex-row items-center">
        <p className="text-base font-semibold text-white whitespace-nowrap">
          {t("footer.securePayments")}
        </p>
        <div className="relative h-14 md:h-16.5 w-full">
          <ImageWithFallback
            src={`/payment.png`}
            alt="payment method image"
            fill
            className="object-contain"
          />
        </div>
      </div>
      <div className="border-t border-[#565656] mt-3 pt-3 text-center text-sm font-normal text-white">
        {t("footer.copyright")}
      </div>
    </div>
  );
};

export default FooterBottom;
