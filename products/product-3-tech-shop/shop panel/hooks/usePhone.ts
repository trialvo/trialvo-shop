"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assertValidPhoneId } from "@/lib/adapters/accountAddress";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import {
  phoneService,
  type PhoneMutationResponse,
} from "@/lib/api/phone/service";
import { addressKeys } from "@/hooks/useAddress";
import { authKeys } from "@/hooks/useAuth";

export type SendPhoneOtpInput = {
  phoneId: number;
};

export type VerifyPhoneOtpInput = {
  phoneId: number;
  otp: string;
};

/**
 * Authenticated phone OTP — send / verify by `phone_id` (user_phones row).
 */
export const usePhone = () => {
  const queryClient = useQueryClient();

  const invalidatePhoneConsumers = () => {
    void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    void queryClient.invalidateQueries({ queryKey: authKeys.user() });
  };

  const sendPhoneOtp = useMutation<
    PhoneMutationResponse,
    Error,
    SendPhoneOtpInput
  >({
    mutationFn: async ({ phoneId }) => {
      const id = assertValidPhoneId(phoneId);
      const res = await phoneService.verifyPhone(id);
      if (res?.success === false) {
        throw new Error(res.error || res.message || "Failed to send OTP");
      }
      return res;
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Failed to send phone OTP"));
    },
  });

  const verifyPhoneOtp = useMutation<
    PhoneMutationResponse,
    Error,
    VerifyPhoneOtpInput
  >({
    mutationFn: async ({ phoneId, otp }) => {
      const id = assertValidPhoneId(phoneId);
      const code = otp.trim();
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Enter the 6-digit code.");
      }
      const res = await phoneService.verifyPhoneOtp(id, code);
      if (res?.success === false) {
        throw new Error(res.error || res.message || "Phone verification failed");
      }
      return res;
    },
    onSuccess: () => {
      invalidatePhoneConsumers();
    },
    onError: (error) => {
      console.error(getUnknownErrorMessage(error, "Phone verification failed"));
    },
  });

  return {
    sendPhoneOtp,
    verifyPhoneOtp,
    isSendingOtp: sendPhoneOtp.isPending,
    isVerifying: verifyPhoneOtp.isPending,
  };
};
