"use client";

import { RadioGroupItem } from "@/components/ui/radio-group";
import clsx from "clsx";
import React from "react";

type Props = {
  id: string;
  label: string;
  icon?: React.ElementType;
  checked?: boolean;
};

const PaymentCard: React.FC<Props> = ({
  id,
  label,
  icon: Icon,
  checked,
}) => {
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex cursor-pointer items-center justify-between border p-2 sm:p-4 transition",
        checked
          ? "border-black"
          : "border-gray-400 hover:border-gray-400"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem id={id} value={id} />
        <span className="text-sm font-normal">{label}</span>
      </div>

      {/* <Icon className="h-6 w-6 text-gray-700" /> */}
    </label>
  );
};

export default PaymentCard;
