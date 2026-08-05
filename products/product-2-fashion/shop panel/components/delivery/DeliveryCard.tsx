"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn, toPublicUrl } from "@/lib/utils";
import React from "react";

type Props = {
  id: string;
  tag?: string;
  name?: string;
  title?: string;
  price?: string | number;
  phone?: string;
  addressLine?: string;
  isVerified?: boolean;
  onVerifyPhone?: () => void;
  icon: React.ElementType;
  checked?: boolean;
  src?: string | null;
};

const DeliveryCard: React.FC<Props> = ({
  id,
  tag,
  name,
  title,
  price,
  phone,
  addressLine,
  icon: Icon,
  checked,
  isVerified,
  onVerifyPhone,
  src
}) => {
  const safeSrc = typeof src === "string" && src.trim().length > 0 ? src.trim() : null;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between border px-2 sm:px-4 py-2 sm:py-4 transition",
        checked
          ? "border-black"
          : "border-gray-400 hover:border-gray-400"
      )}
    >
      <div className="flex items-start gap-3">
        <RadioGroupItem id={id} value={id} className="mt-1" />

        <div>
          <p className="text-xs w-fit bg-[#D9EFFF] px-1.5 py-0.5 font-normal mb-2">{tag ?? title}</p>
          <p className="text-sm text-black font-medium">{name}</p>
          {phone && (
            <div className="mt-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm text-black font-medium">{phone}</span>
                <span
                  className={cn(
                    "rounded-none px-1.5 py-0.5 text-[10px] font-medium leading-none shrink-0",
                    isVerified
                      ? "bg-[#E8FFF0] text-[#008A2E]"
                      : "bg-[#FFF0F0] text-[#C40000]",
                  )}
                >
                  {isVerified ? "Verified" : "Unverified"}
                </span>
              </div>
              {!isVerified && onVerifyPhone && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onVerifyPhone(); }}
                  className="mt-1 rounded-none bg-[#EDEDED] px-2 py-0.5 text-[11px] font-medium text-black cursor-pointer transition-colors hover:bg-black/10"
                >
                  Verify Phone
                </button>
              )}
            </div>
          )}
          {
            addressLine && (
              <p className="text-xs text-black font-normal">{addressLine}</p>
            )
          }
          {
            price && (
              <p className="text-xs text-black font-normal">{price}</p>
            )
          }
        </div>
      </div>

      {
        safeSrc && (
          <div
            className={cn(
              `
          relative h-6 w-6 overflow-hidden border-0
          transition-colors duration-200
          group-hover:border-[#999999]
        `,
            )}
          >
            <ImageWithFallback
              src={toPublicUrl(safeSrc) || ""}
              alt="Delivery Icon"
              fill
              preload
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          </div>
        )
      }
    </label>
  );
};

export default DeliveryCard;
