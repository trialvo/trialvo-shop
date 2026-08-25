"use client";

import { RadioGroup } from "@/components/ui/radio-group";
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
  emptyMessage = "No addresses found",
}) => {
  if (isLoading) {
    return (
      <RadioGroup value={value} onValueChange={onChange} className="gap-2">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <AddressSelectableCardSkeleton key={`address-skel-${idx}`} />
        ))}
      </RadioGroup>
    );
  }

  if (items?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-black/[0.03]">
          <FiMapPin className="h-6 w-6 text-black/25" />
        </div>
        <h3 className="text-sm font-semibold text-black">{emptyMessage}</h3>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-black/50">
          Add an address below to get started with your deliveries.
        </p>
      </div>
    );
  }

  return (
    <RadioGroup value={value} onValueChange={onChange} className="gap-2">
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
  );
};

export default AddressListPanel;
