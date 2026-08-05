import { openModal } from "@/redux/slices/modalManagerSlice";
import type { AppDispatch } from "@/redux/store";

export type ConfirmDeletePayload = {
  callbackId: string;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
};

type ConfirmDeleteCallback = () => void | Promise<void>;

const callbacks = new Map<string, ConfirmDeleteCallback>();

function makeCallbackId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function registerConfirmDeleteCallback(cb: ConfirmDeleteCallback): string {
  const id = makeCallbackId();
  callbacks.set(id, cb);
  return id;
}

export function consumeConfirmDeleteCallback(id: string): ConfirmDeleteCallback | undefined {
  const cb = callbacks.get(id);
  callbacks.delete(id);
  return cb;
}

export function removeConfirmDeleteCallback(id: string): void {
  callbacks.delete(id);
}

export function openConfirmDelete(
  dispatch: AppDispatch,
  onConfirm: ConfirmDeleteCallback,
  options?: Omit<ConfirmDeletePayload, "callbackId">,
) {
  const callbackId = registerConfirmDeleteCallback(onConfirm);

  dispatch(
    openModal({
      key: "confirmDelete",
      payload: {
        callbackId,
        title: options?.title,
        description: options?.description,
        cancelText: options?.cancelText,
        confirmText: options?.confirmText,
      } satisfies ConfirmDeletePayload,
    }),
  );

  return callbackId;
}
