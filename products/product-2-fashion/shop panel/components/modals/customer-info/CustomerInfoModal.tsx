"use client";

import AddNewDeliveryAddressForm from "@/components/account/address-book/AddNewAddress";
import ModalShell from "@/components/modals/ModalShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiArrowLeft, FiX } from "react-icons/fi";

type Props = {
  open: boolean;
  isTop: boolean;
  zIndex: number;
  onOpenChange: (open: boolean) => void;
};

const CustomerInfoModal: React.FC<Props> = ({ open, isTop, zIndex, onOpenChange }) => {
  const { t } = useTranslation();
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      isTop={isTop}
      zIndex={zIndex}
      contentClassName={cn(
        "p-0",
        "w-screen max-w-none",
        "h-[100dvh] sm:h-auto",
        "rounded-none",
        "sm:w-[800px]!"
      )}
    >
      <div className="relative flex h-full flex-col bg-white">
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-black/10 bg-white px-4 py-3 sm:hidden">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Back"
            className="inline-flex h-9 w-9 items-center justify-center hover:bg-[#f1f1f1] transition-colors duration-200 cursor-pointer"
          >
            <FiArrowLeft className="h-5 w-5 text-black" />
          </button>

          <div className="flex-1 text-left text-lg font-semibold text-black">{t("customerInfo.addAddress")}</div>
        </div>

        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute -right-5 -top-5 hidden h-10 w-10 rounded-none bg-black p-0 text-white sm:inline-flex"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </Button>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6">
          <AddNewDeliveryAddressForm onOpenChange={() => onOpenChange(false)} />
        </div>
      </div>
    </ModalShell>
  );
};

export default CustomerInfoModal;
