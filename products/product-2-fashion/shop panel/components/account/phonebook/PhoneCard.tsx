"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  id: string;
  phone?: string;
  isVerified?: boolean;
  icon: React.ElementType;
  checked?: boolean;
  onVerify?: (id: string | number, Phone?: string) => void;
};

const PhoneCard: React.FC<Props> = ({
  id,
  phone,
  isVerified = false,
  icon: Icon,
  checked,
  onVerify,
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between border px-4 py-4 transition",
        checked ? "border-black" : "border-gray-400 hover:border-gray-400",
      )}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem id={id} value={id} className="mt-1" />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-black">{phone ?? ""}</p>

            <span
              className={cn(
                "rounded-none px-2 py-0.5 text-xs font-medium",
                isVerified ? "bg-[#E8FFF0] text-[#008A2E]" : "bg-[#FFF0F0] text-[#C40000]",
              )}
            >
              {isVerified ? "Verified" : "Unverified"}
            </span>
            {
              !isVerified && (
                <button
                  type="button"
                  onClick={() => {
                    onVerify?.(id, phone);
                  }}
                  className={cn(
                    "rounded-none bg-[#EDEDED] px-2 py-1.5 text-xs font-medium text-black",
                    "cursor-pointer transition-all duration-300 hover:bg-black/10",
                  )}
                >
                  Verify
                </button>
              )
            }
          </div>
        </div>
      </div>

      <Icon className="h-6 w-6 text-gray-700" />
    </label>
  );
};

export default PhoneCard;
