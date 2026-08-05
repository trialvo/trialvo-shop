"use client";

import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import React from "react";
import { ModalEntryProps } from "../ModalRegistry";
import { QuickEditPayload } from "./QuickEditModal";
import QuickEditModalResponsive from "./QuickEditModalResponsive";

const QuickEditModalEntry: React.FC<ModalEntryProps> = ({
  modalId,
  isTop,
  zIndex,
  payload,
}) => {
  const dispatch = useAppDispatch();
  const data = payload as QuickEditPayload;

  if (!data) return null;

  return (
    <QuickEditModalResponsive
      open
      isTop={isTop}
      zIndex={zIndex}
      onOpenChange={(v) => {
        if (!v) dispatch(closeModalById(modalId));
      }}
      payload={data}
    />
  );
};

export default QuickEditModalEntry;