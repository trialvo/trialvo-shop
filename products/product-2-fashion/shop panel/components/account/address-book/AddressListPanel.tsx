"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { FiMapPin } from "react-icons/fi";
import AddressSelectableCard from "./AddressSelectableCard";
import AddressSelectableCardSkeleton from "./AddressSelectableCardSkeleton";
import type { AddressItem } from "./types";

type Props = {
  items: AddressItem[];
  value: string;
  onChange: (id: string) => void;

  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onMakeDefault?: (id: string | number) => void;
  onVerifyPhone?: (phoneId: number, phoneNumber: string) => void;

  isLoading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
};

const AddressListPanel: React.FC<Props> = ({
  items,
  value,
  onChange,
  onEdit,
  onDelete,
  onMakeDefault,
  onVerifyPhone,
  isLoading = false,
  skeletonCount = 3,
  emptyMessage,
}) => {
  const { t } = useTranslation();
  const resolvedEmptyMessage = emptyMessage ?? t("account.addressBook.emptyAddresses");

  if (isLoading) {
    return (
      <RadioGroup value={value} onValueChange={onChange} className="gap-3">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <AddressSelectableCardSkeleton key={`address-skel-${idx}`} />
        ))}
      </RadioGroup>
    );
  }

  if (items?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#E0E0E0] bg-[#FAFAFA] px-6 py-14 text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#E8E8E8] bg-white shadow-sm">
          <FiMapPin className="h-5 w-5 text-black/30" />
        </div>
        <h3 className="text-sm font-semibold text-[#191919]">{resolvedEmptyMessage}</h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-black/50">
          {t("account.addressBook.emptyAddressesDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="rounded-md border border-[#E8E8E8] bg-[#FAFAFA] px-3.5 py-3">
        <p className="flex items-center justify-center gap-2.5 text-center text-[14px] font-semibold leading-snug tracking-tight text-[#191919]">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#191919] text-[11px] font-bold leading-none text-white">
            !
          </span>
          {t("account.addressBook.selectHint")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
          {t("account.addressBook.savedAddresses")}
        </p>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black/5 px-1.5 text-[10px] font-semibold text-black/55">
          {items.length}
        </span>
      </div>

      <RadioGroup value={value} onValueChange={onChange} className="gap-3">
        {items.map((item) => {
          const idStr = String(item.id);

          return (
            <AddressSelectableCard
              key={item.id}
              item={item}
              checked={value === idStr}
              onEdit={onEdit}
              onDelete={onDelete}
              onMakeDefault={onMakeDefault}
              onVerifyPhone={onVerifyPhone}
            />
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default AddressListPanel;
