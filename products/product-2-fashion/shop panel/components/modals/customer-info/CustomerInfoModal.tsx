"use client";

import AddNewDeliveryAddressForm from "@/components/account/address-book/AddNewAddress";
import ModalShell from "@/components/modals/ModalShell";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import * as React from "react";
import { FiMapPin } from "react-icons/fi";

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
      title={t("customerInfo.addAddress")}
      icon={<FiMapPin className="h-4 w-4" strokeWidth={1.75} />}
      contentClassName={cn(
        "w-[calc(100vw-32px)] max-w-[720px]",
        "h-[100dvh] sm:h-auto",
      )}
      bodyClassName="px-5 py-5"
    >
      <AddNewDeliveryAddressForm onOpenChange={() => onOpenChange(false)} />
    </ModalShell>
  );
};

export default CustomerInfoModal;
