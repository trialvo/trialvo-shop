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
        "flex cursor-pointer items-center justify-between gap-4 border px-4 py-3.5 transition-colors",
        checked
          ? "border-black bg-[#FAFAFA]"
          : "border-[#E5E5E5] hover:border-black/30"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <RadioGroupItem id={id} value={id} className="mt-0.5" />

        <div className="min-w-0">
          {name ? (
            <>
              {tag || title ? (
                <p className="mb-0.5 text-[11px] capitalize text-black/40">
                  {tag ?? title}
                </p>
              ) : null}
              <p className="text-sm font-medium text-black">{name}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-black">{title ?? tag}</p>
          )}
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
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {price ? (
          <p className="text-sm font-medium text-black">{price}</p>
        ) : null}
        {safeSrc ? (
          <div className="relative h-6 w-6 overflow-hidden">
            <ImageWithFallback
              src={toPublicUrl(safeSrc) || ""}
              alt="Delivery Icon"
              fill
              preload
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </label>
  );
};

export default DeliveryCard;
