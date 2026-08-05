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
    <Card className="rounded-none border-0 bg-white p-4! shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t("account.personalProfile.title")}</h3>
        <Button
          type="button"
          variant="outline"
          className="h-7 rounded-none border-[#999999] px-4 py-2 text-sm font-medium text-[#272727]"
          onClick={onEdit}
        >
          {t("account.personalProfile.edit")}
        </Button>
      </div>

      <div>
        <div className="grid grid-cols-[130px_1fr] gap-y-4 text-sm">
          <div className="font-semibold">{t("account.personalProfile.fullName")}</div>
          <div>
            {profile?.first_name} {profile?.last_name}
          </div>

          <div className="font-semibold">{t("account.personalProfile.email")}</div>
          <div>{profile?.email}</div>

          <div className="font-semibold">{t("account.personalProfile.mobileNumber")}</div>

          {
            defaultPhone?.phone_number ? (
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-black">{defaultPhone?.phone_number ?? ""}</p>

                <span
                  className={cn(
                    "rounded-none px-2 py-0.5 text-xs font-medium",
                    isVerified ? "bg-[#E8FFF0] text-[#008A2E]" : "bg-[#FFF0F0] text-[#C40000]",
                  )}
                >
                  {isVerified ? t("account.personalProfile.verified") : t("account.personalProfile.unverified")}
                </span>
                {
                  !isVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        handleVerify?.(String(defaultPhone?.id), defaultPhone?.phone_number);
                      }}
                      className={cn(
                        "rounded-none bg-[#EDEDED] px-2 py-0.75 text-xs font-medium text-black",
                        "cursor-pointer transition-all duration-300 hover:bg-black/10",
                      )}
                    >
                      {t("account.personalProfile.verify")}
                    </button>
                  )
                }
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
                className="w-fit text-left font-medium text-[#0088FF] hover:underline cursor-pointer"
              >
                {t("account.personalProfile.addMobileNumber")}
              </button>
            )
          }

          <div className="font-semibold">{t("account.personalProfile.birthday")}</div>
          <div>{profile?.dob ? formatPrettyDate(profile.dob) : t("account.personalProfile.none")}</div>

          <div className="font-semibold">{t("account.personalProfile.gender")}</div>
          <div>{profile?.gender ? profile.gender : t("account.personalProfile.notSelected")}</div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalProfileCard;
