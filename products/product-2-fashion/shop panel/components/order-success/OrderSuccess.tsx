"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { OrderSuccessData } from "../order-summary/order.types";
import DeliveryAddressInfo from "./DeliveryAddressInfo";

type Props = {
  data: OrderSuccessData;
  showTrackOrder?: boolean;
};

const OrderSuccess: React.FC<Props> = ({ data, showTrackOrder = true }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-10 w-full sm:w-163 mt-6">
      <div className="space-y-3">
        <h1 className="text-[28px] font-semibold leading-8 text-black">
          {t("orderSuccess.title")}
        </h1>

        <p className="text-sm font-normal leading-5.5 text-black/80">
          {data.confirmationEmail ? (
            <>
              {t("orderSuccess.emailSentPrefix")}{" "}
              <span className="font-medium">{data.confirmationEmail}</span>{" "}
              {t("orderSuccess.emailSentSuffix")}
            </>
          ) : (
            t("orderSuccess.noEmailProvided")
          )}
        </p>
      </div>

      <DeliveryAddressInfo address={data.deliveryAddress} />

      <div className="hidden flex-wrap items-center gap-6 pt-2.5 sm:flex">
        {showTrackOrder ? (
          <Button
            variant="outline"
            className="h-9 rounded-none border-[#A9A9A9] px-4 py-2 text-sm font-medium text-black"
            asChild
          >
            <Link href={data.trackOrderHref}>{t("orderSuccess.trackOrder")}</Link>
          </Button>
        ) : null}

        <Button
          className="h-9 rounded-none bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          asChild
        >
          <Link href={data.continueShoppingHref}>{t("orderSuccess.continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
