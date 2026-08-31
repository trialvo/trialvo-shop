"use client";

import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import React from "react";
import { FiCheck } from "react-icons/fi";
import { OrderSuccessData } from "../order-summary/order.types";
import DeliveryAddressInfo from "./DeliveryAddressInfo";

type Props = {
  data: OrderSuccessData;
  showTrackOrder?: boolean;
};

const OrderSuccess: React.FC<Props> = ({ data, showTrackOrder = true }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full min-w-0 space-y-6 min-[768px]:space-y-8">
      <div className="space-y-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#191919] text-white">
          <FiCheck className="h-6 w-6" strokeWidth={2.5} />
        </span>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
            {t("orderSuccess.confirmed")}
          </p>
          <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#191919] min-[768px]:text-[32px]">
            {t("orderSuccess.title")}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#5F5F5F]">
            {data.confirmationEmail ? (
              <>
                {t("orderSuccess.emailSentPrefix")}{" "}
                <span className="font-semibold text-[#191919]">
                  {data.confirmationEmail}
                </span>{" "}
                {t("orderSuccess.emailSentSuffix")}
              </>
            ) : (
              t("orderSuccess.noEmailProvided")
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center rounded-full bg-[#F3F1ED] px-3 text-[12px] font-semibold text-[#191919]">
            {t("orderSummary.orderId")} #{data.meta.orderId}
          </span>
          <span className="inline-flex h-8 items-center rounded-full bg-[#F3F1ED] px-3 text-[12px] font-medium text-[#5F5F5F]">
            {data.meta.date}
          </span>
          <span className="inline-flex h-8 items-center rounded-full bg-[#F3F1ED] px-3 text-[12px] font-medium text-[#5F5F5F]">
            {data.meta.paymentMethod}
          </span>
        </div>
      </div>

      <DeliveryAddressInfo address={data.deliveryAddress} />

      <div className="hidden flex-wrap items-center gap-3 pt-1 min-[640px]:flex">
        {showTrackOrder ? (
          <Link
            href={data.trackOrderHref}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-black/15 bg-white px-4 text-[13px] font-semibold text-[#191919] transition-colors hover:border-[#191919] hover:bg-[#FAF8F5]"
          >
            {t("orderSuccess.trackOrder")}
          </Link>
        ) : null}

        <Link
          href={data.continueShoppingHref}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black"
        >
          {t("orderSuccess.continueShopping")}
        </Link>
      </div>

      <div className="rounded-2xl bg-[#F7F4EE] px-4 py-4 min-[768px]:px-5">
        <p className="text-[13px] font-semibold tracking-tight text-[#191919]">
          {t("orderSuccess.helpTitle")}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[#5F5F5F]">
          {t("orderSuccess.helpBody")}
        </p>
        <Link
          href="/contact-us"
          className="mt-3 inline-flex text-[13px] font-semibold text-[#191919] underline-offset-2 hover:underline"
        >
          {t("orderSuccess.contactUs")}
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
