"use client";

import { cn } from "@/lib/utils";
import React from "react";
import type { IconType } from "react-icons";
import { FiChevronRight } from "react-icons/fi";

type Props = {
  icon: IconType;
  label: string;
  onClick: () => void;
  className?: string;
};

const AccountMenuItem: React.FC<Props> = ({ icon: Icon, label, onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between",
        "px-3 py-4.5",
        "border-b border-black/10",
        "bg-white",
        "active:bg-black/5",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="h-5 w-5 text-black" />
        <span className="text-sm font-bold text-black">{label}</span>
      </span>

      <FiChevronRight className="h-5 w-5 text-black/60" />
    </button>
  );
};

export default AccountMenuItem;
