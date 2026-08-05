"use client";

import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { DeliveryAddress } from "../order-summary/order.types";

type Props = {
  address: DeliveryAddress;
};

const DeliveryAddressInfo: React.FC<Props> = ({ address }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-black">{t("deliveryAddress.title")}</h3>

      <div className="grid grid-cols-1 gap-y-2 text-sm text-black sm:grid-cols-[180px_1fr]">
        <div>
          <div className="font-semibold">{t("deliveryAddress.name")}</div>
          <div>{address.name}</div>
        </div>
        <div>
          <div className="font-semibold">{t("deliveryAddress.address")}</div>
          <div>{address.address}</div>
        </div>
        <div>
          <div className="font-semibold">{t("deliveryAddress.mobile")}</div>
          <div>{address.mobile}</div>
        </div>
        <div>
          <div className="font-semibold">{t("deliveryAddress.email")}</div>
          <div>{address.email}</div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAddressInfo;
