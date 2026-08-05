"use client";

import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import React from "react";
import { ModalEntryProps } from "../ModalRegistry";
import QuickAddModalResponsive from "./QuickAddModalResponsive";

type QuickAddPayload = {
  id: number;
};

const QuickAddModalEntry: React.FC<ModalEntryProps> = ({
  modalId,
  isTop,
  zIndex,
  payload,
}) => {
  const dispatch = useAppDispatch();
  const data = payload as QuickAddPayload;

  if (!data) return null;

  return (
    <QuickAddModalResponsive
      open
      isTop={isTop}
      zIndex={zIndex}
      onOpenChange={(v) => {
        if (!v) dispatch(closeModalById(modalId));
      }}
      id={data?.id}
      onAddToCart={() => {
        dispatch(closeModalById(modalId));
      }}
    />
  );
};

export default QuickAddModalEntry;
