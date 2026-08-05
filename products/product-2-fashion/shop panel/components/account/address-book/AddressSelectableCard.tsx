"use client";

import DeliveryCard from "@/components/delivery/DeliveryCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import type { AddressItem } from "./types";

const NoIcon: React.FC<{ className?: string }> = () => null;

type Props = {
  item: AddressItem;
  checked: boolean;

  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  onMakeDefault?: (id: string | number) => void;
  onVerifyPhone?: (phoneId: number, phoneNumber: string) => void;
};

const AddressSelectableCard: React.FC<Props> = ({
  item,
  checked,
  onEdit,
  onDelete,
  onMakeDefault,
  onVerifyPhone,
}) => {
  const isVerified = item.is_verified === 1;

  return (
    <div className="relative">
      <DeliveryCard
        id={item.id?.toString()}
        tag={item?.address_type}
        name={item?.name}
        phone={item?.phone_number}
        addressLine={item?.full_address}
        isVerified={isVerified}
        icon={NoIcon}
        checked={checked}
        onVerifyPhone={(!isVerified && item.phone_id) ? () => onVerifyPhone?.(item.phone_id, item.phone_number) : undefined}
      />

      <div className="absolute right-4 top-4 z-10">
        {item?.is_default ? (
          <span className="rounded-none bg-[#666666] px-1.5 py-0.5 text-xs font-medium text-white">
            Default
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onMakeDefault?.(item?.id)}
            className="rounded-none transition-all duration-300 bg-[#EDEDED] hover:bg-black/10 px-2 py-1.5 text-xs font-medium cursor-pointer text-black"
          >
            Make It Default
          </button>
        )}
      </div>

      <div className="absolute bottom-2 right-4 z-10 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-[2px]")}
          onClick={() => onEdit?.(item.id)}
          aria-label="Edit address"
        >
          <FiEdit className="h-4 w-4 text-black/70" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-[2px]")}
          onClick={() => onDelete?.(item.id)}
          aria-label="Delete address"
        >
          <FiTrash2 className="h-4 w-4 text-[#E52D2D]/90" />
        </Button>
      </div>
    </div>
  );
};

export default AddressSelectableCard;
