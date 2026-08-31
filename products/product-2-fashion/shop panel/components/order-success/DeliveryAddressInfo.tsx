"use client";

import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { FiMapPin, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { DeliveryAddress } from "../order-summary/order.types";

type Props = {
  address: DeliveryAddress;
};

const DeliveryAddressInfo: React.FC<Props> = ({ address }) => {
  const { t } = useTranslation();

  const rows = [
    { icon: FiUser, label: t("deliveryAddress.name"), value: address.name },
    { icon: FiMapPin, label: t("deliveryAddress.address"), value: address.address },
    { icon: FiPhone, label: t("deliveryAddress.mobile"), value: address.mobile },
    { icon: FiMail, label: t("deliveryAddress.email"), value: address.email },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      <div className="border-b border-black/6 px-4 py-3.5 min-[768px]:px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
          {t("deliveryAddress.title")}
        </p>
      </div>

      <div className="divide-y divide-black/6">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="flex gap-3 px-4 py-3.5 min-[768px]:px-5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F3F1ED] text-[#191919]">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A8A8A]">
                  {row.label}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#191919]">
                  {row.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryAddressInfo;
