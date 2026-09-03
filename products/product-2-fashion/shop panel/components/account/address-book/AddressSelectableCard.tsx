"use client";

import { Button } from "@/components/ui/button";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
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

function getAddressTypeLabel(
  type: AddressItem["address_type"],
  t: (key: string) => string,
): string {
  if (type === "home") return t("customerInfo.home");
  if (type === "office") return t("customerInfo.office");
  return t("customerInfo.na");
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "verified" | "unverified";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tone === "default" && "bg-[#FFF4EB] text-[#C2410C]",
        tone === "verified" && "bg-[#ECFDF3] text-[#16A34A]",
        tone === "unverified" && "bg-[#FEF2F2] text-[#DC2626]",
      )}
    >
      {tone === "default" ? <Star className="h-3 w-3 fill-current" aria-hidden /> : null}
      {tone === "verified" ? <CheckCircle2 className="h-3 w-3" aria-hidden /> : null}
      {tone === "unverified" ? <AlertCircle className="h-3 w-3" aria-hidden /> : null}
      {label}
    </span>
  );
}

function FooterAction({
  label,
  icon: Icon,
  onClick,
  tone = "neutral",
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  tone?: "neutral" | "danger" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15",
        tone === "neutral" && "text-black/60 hover:bg-white hover:text-black",
        tone === "danger" && "text-black/50 hover:bg-white hover:text-rose-600",
        tone === "primary" && "text-[#191919] hover:bg-white",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
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
  const isDefault = item.is_default === 1;
  const idStr = String(item.id);
  const showVerifyAction = !isVerified && Boolean(item.phone_id && item.phone_number && onVerifyPhone);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-md border bg-white transition-all duration-200",
        checked
          ? "border-[#191919] bg-[#FAFAFA] shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-[#191919]/8"
          : "border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-0.75 bg-[#191919] transition-opacity duration-200",
          checked ? "opacity-100" : "opacity-0",
        )}
      />

      <label
        htmlFor={`address-${idStr}`}
        className="flex cursor-pointer gap-3.5 px-4 py-4 pl-5"
      >
        <RadioGroupItem id={`address-${idStr}`} value={idStr} className="mt-1.5" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold tracking-tight text-[#191919]">
                  {item.name}
                </h3>
                {item.address_type ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black/50">
                    {getAddressTypeLabel(item.address_type, t)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {isDefault ? (
                <StatusPill label={t("account.addressBook.default")} tone="default" />
              ) : null}
              {item.phone_number ? (
                <StatusPill
                  label={
                    isVerified
                      ? t("account.addressBook.verified")
                      : t("account.addressBook.unverified")
                  }
                  tone={isVerified ? "verified" : "unverified"}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-2.5 space-y-1.5">
            {item.phone_number ? (
              <p className="flex items-center gap-2 text-sm text-black/75">
                <Phone className="h-3.5 w-3.5 shrink-0 text-black/40" aria-hidden />
                <span>{item.phone_number}</span>
              </p>
            ) : null}
            {item.full_address ? (
              <p className="flex items-start gap-2 text-sm leading-relaxed text-black/55">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black/40" aria-hidden />
                <span>{item.full_address}</span>
              </p>
            ) : null}
          </div>
        </div>
      </label>

      {showVerifyAction ? (
        <div className="mx-4 mb-3.5 flex flex-col gap-2.5 rounded-md border border-[#E8E4DC] bg-[#FAF8F5] px-3.5 py-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#8A6D3B]" aria-hidden />
            <p className="text-xs leading-relaxed text-[#5C4D35]">
              {t("account.addressBook.verifyPhoneHint")}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-md bg-[#191919] px-3.5 text-xs font-semibold text-white hover:bg-black"
            onClick={() => onVerifyPhone?.(item.phone_id, item.phone_number)}
          >
            {t("account.addressBook.verify")}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EEEEEE] bg-[#F8F8F8] px-3 py-2">
        <div className="flex flex-wrap items-center gap-0.5">
          <FooterAction
            label={t("account.addressBook.edit")}
            icon={Pencil}
            onClick={() => onEdit?.(item.id)}
          />

          <span className="mx-0.5 h-4 w-px bg-[#E0E0E0]" aria-hidden />

          <FooterAction
            label={t("account.addressBook.remove")}
            icon={Trash2}
            tone="danger"
            onClick={() => onDelete?.(item.id)}
          />
        </div>

        {!isDefault ? (
          <FooterAction
            label={t("account.addressBook.setDefault")}
            icon={Star}
            tone="primary"
            onClick={() => onMakeDefault?.(item.id)}
          />
        ) : null}
      </div>
    </article>
  );
};

export default AddressSelectableCard;
