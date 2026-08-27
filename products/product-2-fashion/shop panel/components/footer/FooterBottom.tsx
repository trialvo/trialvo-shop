"use client";

import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import PaymentMarks from "./PaymentMarks";

const FooterBottom: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="border-t border-white/10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-3.5 sm:flex-row">
        <p className="order-2 text-center text-xs text-white/45 sm:order-1 sm:text-left">
          {t("footer.copyright")}
        </p>
        <div className="order-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:order-2 sm:justify-end">
          <p className="whitespace-nowrap text-xs text-white/45">
            {t("footer.securePayments")}
          </p>
          <PaymentMarks />
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
