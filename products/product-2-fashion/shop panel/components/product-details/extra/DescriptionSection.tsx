"use client";

import * as React from "react";
import { FiCheck } from "react-icons/fi";
import HtmlContent from "./HtmlContent";
import SectionHeader from "./SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  title?: string;
  description?: string;
  material?: string;
  comfortFit?: string;
  careInstructions?: string[];
  sku?: string;
  note?: string;
};

const DescriptionSection: React.FC<Props> = ({
  title,
  description,
  material,
  comfortFit,
  careInstructions,
  sku,
  note,
}) => {
  const { t } = useTranslation();
  const sectionTitle = title ?? t("productDetails.description");

  return (
    <section className="w-full">
      <SectionHeader title={sectionTitle} />

      <div className="mt-4 space-y-6 text-sm leading-6 text-black">
        <HtmlContent html={description} className="mt-4" />

        <div className="space-y-1">
          {material ? (
            <div>
              <span className="font-medium">{t("productDetails.material")}</span> {material}
            </div>
          ) : null}

          {comfortFit ? (
            <div>
              <span className="font-medium">{t("productDetails.comfortFit")}</span>
            </div>
          ) : null}

          {careInstructions?.length ? (
            <div>
              <div className="font-medium">{t("productDetails.careInstruction")}</div>
              <ul className="mt-2 space-y-1">
                {careInstructions.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-start gap-2">
                    <FiCheck className="mt-1 h-4 w-4 text-black" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {(sku || note) ? (
          <div className="space-y-1">
            {sku ? <div className="font-medium">{sku}</div> : null}
            {note ? <div className="text-black/80">{note}</div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default DescriptionSection;
