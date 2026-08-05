"use client";

import type { ModalEntryProps } from "@/components/modals/ModalRegistry";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import * as React from "react";
import SignInModal from "./SignInModal";

export type SignInModalPayload = {
  forgotHref?: string;
  createHref?: string;
};

const SignInModalEntry: React.FC<ModalEntryProps> = ({ modalId, isTop, zIndex, payload }) => {
  const dispatch = useAppDispatch();

  const p = (payload ?? {}) as SignInModalPayload;

  return (
    <SignInModal
      open
      isTop={isTop}
      zIndex={zIndex}
      forgotHref={p.forgotHref}
      createHref={p.createHref}
      onOpenChange={(v) => {
        if (!v) dispatch(closeModalById(modalId));
      }}
    />
  );
};

export default SignInModalEntry;
