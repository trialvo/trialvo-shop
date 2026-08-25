"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
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

const AddressSelectableCard: React.FC<Props> = ({
  item,
  checked,
  onEdit,
  onDelete,
  onMakeDefault,
  onVerifyPhone,
}) => {
  const isVerified = item.is_verified === 1;
  const idStr = String(item.id);

  return (
    <label
      htmlFor={`address-${idStr}`}
      className={cn(
        "flex cursor-pointer gap-3 border px-4 py-3.5 transition-colors",
        checked ? "border-black bg-[#FAFAFA]" : "border-[#E5E5E5] hover:border-black/30",
      )}
    >
      <RadioGroupItem id={`address-${idStr}`} value={idStr} className="mt-1" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-black">{item.name}</p>
            {item.address_type ? (
              <p className="mt-0.5 text-[11px] capitalize text-black/40">{item.address_type}</p>
            ) : null}
          </div>
          {item.is_default ? (
            <span className="shrink-0 text-[11px] font-medium text-black/40">Default</span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onMakeDefault?.(item.id);
              }}
              className="shrink-0 text-[11px] font-medium text-black/55 underline-offset-2 hover:text-black hover:underline"
            >
              Set default
            </button>
          )}
        </div>

        {item.phone_number ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-black/70">
            <span>{item.phone_number}</span>
            <span className={cn("text-[11px]", isVerified ? "text-black/40" : "text-[#C40000]")}>
              {isVerified ? "Verified" : "Unverified"}
            </span>
            {!isVerified && item.phone_id && onVerifyPhone ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onVerifyPhone(item.phone_id, item.phone_number);
                }}
                className="text-[11px] font-medium text-black underline-offset-2 hover:underline"
              >
                Verify
              </button>
            ) : null}
          </div>
        ) : null}

        {item.full_address ? (
          <p className="mt-1 text-sm leading-relaxed text-black/55">{item.full_address}</p>
        ) : null}

        <div className="mt-2.5 flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onEdit?.(item.id);
            }}
            className="font-medium text-black/60 underline-offset-2 hover:text-black hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete?.(item.id);
            }}
            className="font-medium text-black/60 underline-offset-2 hover:text-black hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </label>
  );
};

export default AddressSelectableCard;
