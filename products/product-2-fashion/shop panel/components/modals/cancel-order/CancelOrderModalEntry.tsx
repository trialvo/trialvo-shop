"use client";

import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import * as React from "react";
import { ModalEntryProps } from "../ModalRegistry";
import CancelOrderModal from "./CancelOrderModal";

export type CancelOrderPayload = {
  orderId?: string;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
};

const CancelOrderModalEntry: React.FC<ModalEntryProps> = ({
  modalId,
  isTop,
  zIndex,
  payload,
}) => {
  const dispatch = useAppDispatch();
  const data = (payload ?? {}) as CancelOrderPayload;

  return (
    <CancelOrderModal
      open
      isTop={isTop}
      zIndex={zIndex}
      title={data.title}
      description={data.description}
      cancelLabel={data.cancelLabel}
      confirmLabel={data.confirmLabel}
      onConfirm={data.onConfirm}
      onOpenChange={(v) => {
        if (!v) dispatch(closeModalById(modalId));
      }}
    />
  );
};

export default CancelOrderModalEntry;
