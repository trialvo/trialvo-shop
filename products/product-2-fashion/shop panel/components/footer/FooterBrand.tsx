"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { FiMail } from "react-icons/fi";
import { TbDeviceMobile } from "react-icons/tb";

const FooterBrand: React.FC = () => {
  const { t } = useTranslation();
  const addressLines = t("footer.address").split("\n");

  return (
    <div>
      <ImageWithFallback
        src="/logo-white.svg"
        alt="Vellora"
        width={140}
        height={40}
        preload
      />

      <p className="text-sm text-white leading-relaxed mt-6 pb-8">
        {addressLines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < addressLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>

      <div className="space-y-4 text-sm text-white">
        <p className="flex items-center gap-3">
          <TbDeviceMobile className="text-white h-5 w-5" />
          <span>+880 1970680283</span>
        </p>
        <p className="flex items-center gap-3">
          <FiMail className="text-white h-5 w-5" />
          <span>support@vellora.demo</span>
        </p>
      </div>
    </div>
  );
};

export default FooterBrand;
