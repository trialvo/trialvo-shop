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
    <div className="max-w-70">
      <ImageWithFallback
        src="/logo-white.svg"
        alt="Vellora"
        width={140}
        height={40}
        preload
      />

      <p className="mt-5 text-sm leading-relaxed text-white/55">
        {addressLines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < addressLines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>

      <div className="mt-5 space-y-2.5 text-sm text-white/80">
        <p className="flex items-center gap-2.5">
          <TbDeviceMobile className="h-4 w-4 shrink-0 text-white/50" />
          <span>+880 1970680283</span>
        </p>
        <p className="flex items-center gap-2.5">
          <FiMail className="h-4 w-4 shrink-0 text-white/50" />
          <span>support@vellora.demo</span>
        </p>
      </div>
    </div>
  );
};

export default FooterBrand;
