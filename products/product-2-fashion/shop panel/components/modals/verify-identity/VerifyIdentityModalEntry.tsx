"use client";

import type { VerifyIdentityPayload } from "@/lib/modal/verify-identity";
import {
    getVerifyIdentityCallbacks,
    removeVerifyIdentityCallbacks,
} from "@/lib/modal/verify-identity";
import { useAppDispatch } from "@/redux/hooks";
import { closeModalById } from "@/redux/slices/modalManagerSlice";
import React from "react";
import type { ModalEntryProps } from "../ModalRegistry";
import VerifyIdentityModal from "./VerifyIdentityModal";

const VerifyIdentityModalEntry: React.FC<ModalEntryProps> = ({
  modalId,
  isTop,
  zIndex,
  payload,
}) => {
  const dispatch = useAppDispatch();
  const data = (payload ?? {}) as VerifyIdentityPayload;

  const callbacks = data.callbackId ? getVerifyIdentityCallbacks(data.callbackId) : undefined;

  const handleClose = React.useCallback(() => {
    if (data.callbackId) removeVerifyIdentityCallbacks(data.callbackId);
    dispatch(closeModalById(modalId));
  }, [data.callbackId, dispatch, modalId]);

  return (
    <VerifyIdentityModal
      open
      isTop={isTop}
      zIndex={zIndex}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
      onClose={handleClose}
      maskedTarget={data.maskedTarget}
      length={data.length ?? 6}
      signInHref={data.signInHref}
      onResend={callbacks?.onResend}
      onVerify={async (code) => {
        if (!callbacks?.onVerify) return;

        try {
          await Promise.resolve(callbacks.onVerify(code));
          handleClose();
        } catch {
        }
      }}
    />
  );
};

export default VerifyIdentityModalEntry;
