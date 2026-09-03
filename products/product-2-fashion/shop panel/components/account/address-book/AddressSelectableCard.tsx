"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import React from "react";
import type { AddressItem } from "./types";

type Props = {
  item: AddressItem;
  checked: boolean;

  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onMakeDefault?: (id: string | number) => void;
  onVerifyPhone?: (phoneId: number, phoneNumber: string) => void;
};

function stopLabelAction(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function VerificationPill({ verified, label }: { verified: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        verified ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-600",
      )}
    >
      {verified ? (
        <CheckCircle2 className="h-3 w-3" aria-hidden />
      ) : (
        <AlertCircle className="h-3 w-3" aria-hidden />
      )}
      {label}
    </span>
  );
}

const AddressSelectableCard: React.FC<Props> = ({
  item,
  checked,
  onEdit,
  onDelete,
  onMakeDefault,
  onVerifyPhone,
}) => {
  const { t } = useTranslation();
  const isVerified = item.is_verified === 1;
  const idStr = String(item.id);

  return (
    <label
      htmlFor={`address-${idStr}`}
      className={cn(
        "flex cursor-pointer gap-3 rounded-md border px-4 py-4 transition-[border-color,background-color,box-shadow] duration-200",
        checked
          ? "border-black bg-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "border-[#E5E5E5] hover:border-black/25 hover:bg-[#FCFCFC]",
      )}
    >
      <RadioGroupItem id={`address-${idStr}`} value={idStr} className="mt-0.5" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-black">{item.name}</p>
              {item.address_type ? (
                <span className="inline-flex shrink-0 items-center rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold capitalize text-black/55">
                  {item.address_type}
                </span>
              ) : null}
            </div>
          </div>

          {item.is_default ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#F3F1ED] px-2.5 py-0.5 text-[11px] font-semibold text-[#191919]">
              {t("account.addressBook.default")}
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                stopLabelAction(e);
                onMakeDefault?.(item.id);
              }}
              className="inline-flex h-7 shrink-0 items-center rounded-full border border-black/12 bg-white px-3 text-[11px] font-semibold text-[#191919] shadow-[0_1px_2px_rgba(20,16,12,0.04)] transition-colors hover:border-black/20 hover:bg-[#FAF8F5]"
            >
              {t("account.addressBook.setDefault")}
            </button>
          )}
        </div>

        {item.phone_number ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-black/80">{item.phone_number}</span>
            <VerificationPill
              verified={isVerified}
              label={
                isVerified
                  ? t("account.addressBook.verified")
                  : t("account.addressBook.unverified")
              }
            />
            {!isVerified && item.phone_id && onVerifyPhone ? (
              <button
                type="button"
                onClick={(e) => {
                  stopLabelAction(e);
                  onVerifyPhone(item.phone_id, item.phone_number);
                }}
                className="inline-flex h-7 items-center rounded-full bg-[#191919] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-black"
              >
                {t("account.addressBook.verify")}
              </button>
            ) : null}
          </div>
        ) : null}

        {item.full_address ? (
          <p className="mt-2 text-sm leading-relaxed text-black/55">{item.full_address}</p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              stopLabelAction(e);
              onEdit?.(item.id);
            }}
            className="inline-flex h-8 items-center rounded-full border border-black/10 px-3.5 text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:bg-black/[0.03] hover:text-black"
          >
            {t("account.addressBook.edit")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              stopLabelAction(e);
              onDelete?.(item.id);
            }}
            className="inline-flex h-8 items-center rounded-full border border-transparent px-3.5 text-xs font-semibold text-black/45 transition-colors hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
          >
            {t("account.addressBook.remove")}
          </button>
        </div>
      </div>
    </label>
  );
};

export default AddressSelectableCard;
