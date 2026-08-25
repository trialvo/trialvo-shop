"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePhone } from "@/hooks/usePhone";
import { useTranslation } from "@/hooks/useTranslation";
import type { User } from "@/lib/api/auth/service";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { cn, formatPrettyDate } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import React from "react";
import PersonalProfileCardSkeleton from "./PersonalProfileCardSkeleton";

type Props = {
  profile: User | undefined;
  onEdit?: () => void;
};

const PersonalProfileCard: React.FC<Props> = ({ profile, onEdit }) => {
  const dispatch = useAppDispatch();
  const { verifyPhone, verifyPhoneOTP } = usePhone();
  const { t } = useTranslation();

  if (!profile) {
    return <PersonalProfileCardSkeleton />;
  }

  const rawDefaultPhone = profile?.default_phone as unknown;
  const defaultPhoneId =
    typeof rawDefaultPhone === "number"
      ? rawDefaultPhone
      : typeof rawDefaultPhone === "string" && Number.isFinite(Number(rawDefaultPhone))
      ? Number(rawDefaultPhone)
      : typeof rawDefaultPhone === "object" &&
        rawDefaultPhone !== null &&
        "id" in rawDefaultPhone &&
        typeof (rawDefaultPhone as { id?: unknown }).id === "number"
      ? (rawDefaultPhone as { id: number }).id
      : undefined;

  const defaultPhone =
    profile?.phones?.find((p) => p?.id === defaultPhoneId) ??
    profile?.phones?.find((p) => (p as unknown as { is_default?: number })?.is_default === 1);
  const isVerified = Boolean(defaultPhone?.is_verified);


  const handleVerify = async (id: string | number, Phone?: string) => {
    try {
      const res = await verifyPhone(id);

      openVerifyIdentity(
        dispatch,
        {
          onVerify: async (code) => {
            await verifyPhoneOTP(id, code);
          },
          onResend: async () => {
            await verifyPhone(id);
          },
        },
        {
          maskedTarget: Phone,
          length: 6,
          signInHref: "/sign-in",
        },
      );

      return res;
    } catch {
      // Error handled in mutation
    }
  };


  return (
    <Card className="gap-4 rounded-md border border-[#E5E5E5] bg-white p-4! shadow-none transition-shadow duration-200 ease-out hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] pb-3">
        <h3 className="text-[15px] font-semibold text-black">
          {t("account.personalProfile.title")}
        </h3>
        <Button
          type="button"
          variant="outline"
          className="h-8 rounded-md border-[#D6D6D6] px-3 text-sm font-medium text-black transition-[border-color,background-color,color] duration-200 ease-out hover:border-black hover:bg-black hover:text-white"
          onClick={onEdit}
        >
          {t("account.personalProfile.edit")}
        </Button>
      </div>

      <div>
        <div className="grid grid-cols-[112px_1fr] gap-y-2.5 text-sm min-[576px]:grid-cols-[128px_1fr]">
          <div className="text-black/55">{t("account.personalProfile.fullName")}</div>
          <div className="font-medium text-black">
            {profile?.first_name} {profile?.last_name}
          </div>

          <div className="text-black/55">{t("account.personalProfile.email")}</div>
          <div className="break-all text-black/85">{profile?.email}</div>

          <div className="text-black/55">{t("account.personalProfile.mobileNumber")}</div>

          {defaultPhone?.phone_number ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-black/80">{defaultPhone?.phone_number ?? ""}</p>

              <span
                className={cn(
                  "rounded-sm px-2 py-0.5 text-xs font-medium transition-colors duration-200",
                  isVerified
                    ? "bg-[#E8FFF0] text-[#008A2E]"
                    : "bg-[#FFF0F0] text-[#C40000]",
                )}
              >
                {isVerified
                  ? t("account.personalProfile.verified")
                  : t("account.personalProfile.unverified")}
              </span>
              {!isVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    handleVerify?.(String(defaultPhone?.id), defaultPhone?.phone_number);
                  }}
                  className="cursor-pointer rounded-sm bg-[#EDEDED] px-2 py-0.5 text-xs font-medium text-black transition-colors duration-200 ease-out hover:bg-black/10"
                >
                  {t("account.personalProfile.verify")}
                </button>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                dispatch(
                  openModal({
                    key: "insertPhone",
                    payload: {
                      title: defaultPhone?.phone_number
                        ? t("account.personalProfile.updateMobileTitle")
                        : t("account.personalProfile.addMobileTitle"),
                      description: t("account.personalProfile.useBDNumber"),
                      cancelText: t("account.personalProfile.cancel"),
                      confirmText: t("account.personalProfile.save"),
                      defaultPhone: defaultPhone?.phone_number,
                    },
                  }),
                );
              }}
              className="w-fit cursor-pointer text-left font-medium text-[#0088FF] transition-opacity duration-200 hover:opacity-70"
            >
              {t("account.personalProfile.addMobileNumber")}
            </button>
          )}

          <div className="text-black/55">{t("account.personalProfile.birthday")}</div>
          <div className="text-black/85">
            {profile?.dob ? formatPrettyDate(profile.dob) : t("account.personalProfile.none")}
          </div>

          <div className="text-black/55">{t("account.personalProfile.gender")}</div>
          <div className="capitalize text-black/85">
            {profile?.gender ? profile.gender : t("account.personalProfile.notSelected")}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalProfileCard;
