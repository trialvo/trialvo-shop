"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
    resetAuthUi,
    setError,
    setLoading,
    setSuccess,
} from "@/redux/slices/uiSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
    guestOrderKeys,
    guestOrderService,
    type ApiResponse,
    type CreateGuestOrderPayload,
    type CreateGuestOrderResponse,
    type GuestOrderPermissions,
    type InitiateGuestOrderPayload,
    type InitiateGuestOrderResponse,
    type InitiateGuestPaymentPayload,
    type InitiateGuestPaymentResponse,
    type ResendOtpResponse,
    type UpdateGuestOrderPayload,
    type UpdateGuestOrderResponse,
    type VerifyGuestPhonePayload,
    type VerifyPhoneResponse,
} from "@/lib/api/guest-order/service";


import { useCookieIds } from "./useCookieIds";

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isApiResponse = <T>(v: unknown): v is ApiResponse<T> => {
  if (!isPlainObject(v)) return false;
  return (
    "data" in v ||
    "success" in v ||
    "error" in v ||
    "message" in v ||
    "flag" in v
  );
};

const pickPayload = <T>(res: unknown): T | undefined => {
  if (isApiResponse<T>(res)) {
    const r = res as ApiResponse<T>;
    if (r.data !== undefined) return r.data;
    return res as unknown as T;
  }
  return res as T;
};

export const useGuestOrder = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const ui = useAppSelector((s) => s.ui);
  const isLoading = ui.isLoading;
  const error = ui.error;
  const success = ui.success;

  const clearUi = () => dispatch(resetAuthUi());
  // Auto-read FB cookie IDs — attached to every guest order for CAPI deduplication
  const cookieIds = useCookieIds();

  const createMutation = useMutation({
    mutationFn: (payload: CreateGuestOrderPayload) => {
      // Automatically attach FB cookie IDs for CAPI deduplication
      const enriched: CreateGuestOrderPayload = {
        ...payload,
        fbp: payload.fbp ?? cookieIds.fbp,
        fbc: payload.fbc ?? cookieIds.fbc,
      };
      return guestOrderService.createGuestOrder(enriched);
    },
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: CreateGuestOrderResponse) => {
      const payload = pickPayload<Record<string, unknown>>(res);

      if (res?.error) {
        dispatch(setError(res.error || "Guest order create failed"));
        return;
      }

      if (res?.success) {
        // dispatch(setSuccess(res.message || "Guest order created!"));
      }

      const id = String(
        (res as { id?: unknown }).id ??
          (res as { guest_order_id?: unknown }).guest_order_id ??
          "",
      );
      if (id) {
        await queryClient.invalidateQueries({
          queryKey: guestOrderKeys.detail(id),
        });
      }
    },
    onError: (err: unknown) => {
      // dispatch(setError(getUnknownErrorMessage(err, "Guest order create failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateGuestOrderPayload;
    }) => guestOrderService.updateGuestOrder(id, payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: UpdateGuestOrderResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Guest order update failed"));
        return;
      }

      if (res?.success) {
        // dispatch(setSuccess(res.message || "Guest order updated!"));
      }

      await queryClient.invalidateQueries({ queryKey: guestOrderKeys.all });
    },
    onError: (err: unknown) => {
      // dispatch(setError(getUnknownErrorMessage(err, "Guest order update failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: (id: string) => guestOrderService.resendOtp(id),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: ResendOtpResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Resend OTP failed"));
        return;
      }

      if (res?.success) {
        dispatch(setSuccess(res.message || "OTP sent!"));
      }
    },
    onError: (err: unknown) => {
      // dispatch(setError(getUnknownErrorMessage(err, "Resend OTP failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: VerifyGuestPhonePayload;
    }) => guestOrderService.verifyPhone(id, payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: VerifyPhoneResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Phone verification failed"));
        return;
      }

      if (res?.success) {
        dispatch(setSuccess(res.message || "Phone verified!"));
      }
    },
    onError: (err: unknown) => {
      // dispatch(setError(getUnknownErrorMessage(err, "Phone verification failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const initiateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: InitiateGuestOrderPayload;
    }) => guestOrderService.initiate(id, payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: InitiateGuestOrderResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Guest order initiate failed"));
        return;
      }

      if (res?.success) {
        // dispatch(setSuccess(res.message || "Order initiated!"));
      }
    },
    onError: (err: unknown) => {
      // dispatch(setError(getUnknownErrorMessage(err, "Guest order initiate failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: InitiateGuestPaymentPayload;
    }) => guestOrderService.initiatePayment(id, payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: (res: InitiateGuestPaymentResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Initiate payment failed"));
        return;
      }

      if (res?.success) {
        // dispatch(setSuccess(res.message || "Payment initiated!"));
      }
    },
    onError: (err: unknown) => {
      // dispatch(setError(getUnknownErrorMessage(err, "Initiate payment failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });



  const createGuestOrder = useCallback(
    (payload: CreateGuestOrderPayload) => createMutation.mutateAsync(payload),
    [createMutation],
  );

  const updateGuestOrder = useCallback(
    (id: string, payload: UpdateGuestOrderPayload) =>
      updateMutation.mutateAsync({ id, payload }),
    [updateMutation],
  );

  const resendOtp = useCallback(
    (id: string) => resendOtpMutation.mutateAsync(id),
    [resendOtpMutation],
  );

  const verifyPhone = useCallback(
    (id: string, otp: number | string) =>
      verifyPhoneMutation.mutateAsync({ id, payload: { otp } }),
    [verifyPhoneMutation],
  );

  const initiateGuestOrder = useCallback(
    (id: string, payload: InitiateGuestOrderPayload) =>
      initiateMutation.mutateAsync({ id, payload }),
    [initiateMutation],
  );

  const initiateGuestPayment = useCallback(
    (id: string, payment_method: string) =>
      initiatePaymentMutation.mutateAsync({ id, payload: { payment_method } }),
    [initiatePaymentMutation],
  );


  const getOrderPermissions = useCallback(
    () => guestOrderService.getOrderPermissions(),
    [],
  );

  return {
    createGuestOrder,
    updateGuestOrder,
    resendOtp,
    verifyPhone,
    initiateGuestOrder,
    initiateGuestPayment,
    getOrderPermissions,

    isLoading,
    error,
    success,
    clearUi,

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isResendingOtp: resendOtpMutation.isPending,
    isVerifyingPhone: verifyPhoneMutation.isPending,
    isInitiating: initiateMutation.isPending,
    isInitiatingPayment: initiatePaymentMutation.isPending,
  };
};

