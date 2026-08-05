"use client";

import * as React from "react";
import SectionHeader from "./SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";


type Props = {
  title?: string;
  policy?: string;
};

const ShippingPolicySection: React.FC<Props> = ({
  title,
  policy,
}) => {
  const { t } = useTranslation();
  const sectionTitle = title ?? t("productDetails.shippingPolicy");

  if (!policy) return null;

  const policySections = policy.split("\n\n").filter(Boolean);

  return (
    <section className="w-full pt-10">
      <SectionHeader title={sectionTitle} />
      <div className="mt-4 space-y-3 text-sm leading-6 text-black">
        {policySections.map((section, index) => {
          const isAdditionalNote = section.startsWith("Additional Note:");

          if (isAdditionalNote) {
            return (
              <p
                key={`${section}-${index}`}
                className="rounded-md border border-black/10 bg-black/[0.04] px-4 py-3 font-medium"
              >
                {section}
              </p>
            );
          }

          return <p key={`${section}-${index}`}>{section}</p>;
        })}
      </div>
    </section>
  );
};

export default ShippingPolicySection;
