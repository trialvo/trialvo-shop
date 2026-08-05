"use client";

import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import React from "react";

import type { ModalEntryProps } from "../ModalRegistry";
import MultiAddModal from "./MultiAddModal";
import type { MultiAddProduct, MultiAddSubmitPayload } from "./types";

type MultiAddPayload = {
  product: MultiAddProduct;
  onSubmit?: (payload: MultiAddSubmitPayload) => void | Promise<void>;
};

const MultiAddModalEntry: React.FC<ModalEntryProps> = ({
  modalId,
  isTop,
  zIndex,
  payload,
}) => {
  const dispatch = useAppDispatch();
  const data = payload as MultiAddPayload;

  if (!data?.product) return null;

  return (
    <MultiAddModal
      open
      modalId={modalId}
      isTop={isTop}
      zIndex={zIndex}
      product={data.product}
      onOpenChange={(v) => {
        if (!v) dispatch(closeModalById(modalId));
      }}
      onAddToCart={async (p) => {
        await data?.onSubmit?.(p);
        dispatch(closeModalById(modalId));
      }}
    />
  );
};

export default MultiAddModalEntry;
