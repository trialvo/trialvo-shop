"use client";

import {
  guestOrderService,
  guestOrderKeys,
  type CreateGuestOrderPayload,
  type CreateGuestOrderResponse,
  type UpdateGuestOrderPayload,
  type UpdateGuestOrderResponse,
  type VerifyGuestPhonePayload,
  type VerifyPhoneResponse,
  type ResendOtpResponse,
  type InitiateGuestOrderPayload,
  type InitiateGuestOrderResponse,
  type InitiateGuestPaymentPayload,
  type InitiateGuestPaymentResponse,
  type GuestOrderPermissions,
} from "@/lib/api/guest-order/service";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnknownErrorMessage } from "@/lib/api/errors";

export const useGuestOrder = () => {
  const queryClient = useQueryClient();
  

  const permissionsQuery = useQuery({
    queryKey: ["guest-order", "permissions"],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<GuestOrderPermissions> => {
      return await guestOrderService.getOrderPermissions();
    },
  });

  const createGuestOrder = useMutation<CreateGuestOrderResponse, Error, CreateGuestOrderPayload>({
    mutationFn: async (payload) => {
      const res = await guestOrderService.createGuestOrder(payload);
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Guest order creation failed"));
    },
  });

  const updateGuestOrder = useMutation<UpdateGuestOrderResponse, Error, { id: string; payload: UpdateGuestOrderPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await guestOrderService.updateGuestOrder(id, payload);
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Guest order update failed"));
    },
  });

  const resendOtp = useMutation<ResendOtpResponse, Error, string>({
    mutationFn: async (id) => {
      const res = await guestOrderService.resendOtp(id);
      if (res?.error) throw new Error(res.error);
      // success: res?.message || "OTP sent"
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to resend OTP"));
    },
  });

  const verifyPhone = useMutation<VerifyPhoneResponse, Error, { id: string; payload: VerifyGuestPhonePayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await guestOrderService.verifyPhone(id, payload);
      if (res?.error) throw new Error(res.error);
      // success: "Phone verified!"
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Phone verification failed"));
    },
  });

  const initiateGuestOrder = useMutation<InitiateGuestOrderResponse, Error, { id: string; payload: InitiateGuestOrderPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await guestOrderService.initiate(id, payload);
      if (res?.error) throw new Error(res.error);
      if (res?.success) {
        // success: res?.message || "Order placed successfully!"
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestOrderKeys.all });
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Guest order initiation failed"));
    },
  });

  const initiateGuestPayment = useMutation<InitiateGuestPaymentResponse, Error, { id: string; payload: InitiateGuestPaymentPayload }>({
    mutationFn: async ({ id, payload }) => {
      const res = await guestOrderService.initiatePayment(id, payload);
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Payment initiation failed"));
    },
  });

  const replaceItems = useMutation({
    mutationFn: async ({
      id,
      items,
    }: {
      id: string;
      items: CreateGuestOrderPayload["items"];
    }) => {
      const res = await guestOrderService.replaceItems(id, { items });
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to sync guest items"));
    },
  });

  return {
    permissions: permissionsQuery.data,
    permissionsLoading: permissionsQuery.isLoading,

    createGuestOrder,
    updateGuestOrder,
    resendOtp,
    verifyPhone,
    initiateGuestOrder,
    initiateGuestPayment,
    replaceItems,
  };
};
