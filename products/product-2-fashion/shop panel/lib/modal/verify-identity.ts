import { openModal } from "@/redux/slices/modalManagerSlice";
import type { AppDispatch } from "@/redux/store";

export type VerifyIdentityModalOptions = {
  maskedTarget?: string;
  length?: number;
  signInHref?: string;

  title?: string;
  description?: string;
};

type VerifyIdentityCallbacks = {
  onVerify: (code: string) => Promise<void> | void;
  onResend?: () => Promise<void> | void;
};

export type VerifyIdentityPayload = VerifyIdentityModalOptions & {
  callbackId: string;
};

const store = new Map<string, VerifyIdentityCallbacks>();

const createCallbackId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cb_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const openVerifyIdentity = (
  dispatch: AppDispatch,
  callbacks: VerifyIdentityCallbacks,
  options?: VerifyIdentityModalOptions,
) => {
  const callbackId = createCallbackId();

  store.set(callbackId, callbacks);

  dispatch(
    openModal({
      key: "verifyIdentity",
      payload: {
        callbackId,
        maskedTarget: options?.maskedTarget,
        length: options?.length,
        signInHref: options?.signInHref,
        title: options?.title,
        description: options?.description,
      } satisfies VerifyIdentityPayload,
    }),
  );
};

export const getVerifyIdentityCallbacks = (callbackId: string) => {
  return store.get(callbackId);
};

export const removeVerifyIdentityCallbacks = (callbackId: string) => {
  store.delete(callbackId);
};
