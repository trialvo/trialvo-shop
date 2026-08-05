"use client";

import { RadioGroup } from "@/components/ui/radio-group";
import React from "react";
import { FiMapPin } from "react-icons/fi"; // Import map pin icon
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
  emptyMessage = "No addresses found"
}) => {
  if (isLoading) {
    return (
      <RadioGroup value={value} onValueChange={onChange} className="space-y-4">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <AddressSelectableCardSkeleton key={`address-skel-${idx}`} />
        ))}
      </RadioGroup>
    );
  }

  if (items?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-6">
          <FiMapPin className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">
          {emptyMessage}
        </h3>
        <p className="max-w-sm text-sm text-gray-500">
          Add an address to get started with your deliveries
        </p>
      </div>
    );
  }

  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-4">
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
