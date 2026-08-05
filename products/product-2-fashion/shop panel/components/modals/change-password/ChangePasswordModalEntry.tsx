"use client";

import type { ModalEntryProps } from "@/components/modals/ModalRegistry";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import * as React from "react";
import ChangePasswordModal from "./ChangePasswordModal";

const ChangePasswordModalEntry: React.FC<ModalEntryProps> = ({ modalId, isTop, zIndex }) => {
  const dispatch = useAppDispatch();

  return (
    <ChangePasswordModal
      open
      isTop={isTop}
      zIndex={zIndex}
      onOpenChange={(v) => {
        if (!v) dispatch(closeModalById(modalId));
      }}
    />
  );
};

export default ChangePasswordModalEntry;
