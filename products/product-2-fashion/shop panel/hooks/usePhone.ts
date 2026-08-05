"use client";

import { authKeys } from "@/hooks/useAuth";
import type { ApiResponse, User } from "@/lib/api/auth/service";
import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { useCallback } from "react";

import {
  phoneService,
  type CreatePhonePayload,
  type PhoneItem,
  type PhoneListResponse,
  type PhoneMutationResponse,
  type SinglePhoneResponse,
} from "@/lib/api/phone/service";
import {
  resetAuthUi,
  setError,
  setLoading,
  setSuccess,
} from "@/redux/slices/uiSlice";

import {
  type ApiErrorResponse,
  getAxiosErrorMessage,
  getUnknownErrorMessage,
} from "@/lib/api/errors";

export const phoneKeys = {
  all: ["phone"] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    [
      ...phoneKeys.all,
      "list",
      params?.limit ?? 10,
      params?.offset ?? 0,
    ] as const,
  detail: (id: number) => [...phoneKeys.all, "detail", id] as const,
};

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

const extractPhoneList = (res: PhoneListResponse): PhoneItem[] => {
  if (!res?.success) return [];
  if (!Array.isArray(res?.phones)) return [];
  return res.phones;
};

const extractUserIfAny = (res: unknown): User | null => {
  if (!isPlainObject(res)) return null;

  if (isApiResponse<{ user?: User }>(res)) {
    const payload = pickPayload<{ user?: User }>(res);
    const u = payload?.user ?? (res as ApiResponse<{ user?: User }>).data?.user;
    return u ?? null;
  }

  const data = (res as { data?: unknown }).data;
  if (isPlainObject(data) && "user" in data) {
    return (data as { user?: User }).user ?? null;
  }

  return null;
};

export const usePhone = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const ui = useAppSelector((s) => s.ui);
  const isLoading = ui.isLoading;
  const error = ui.error;
  const success = ui.success;

  const isAuthenticated = AuthCookies.isAuthenticated();

  const clearUi = () => dispatch(resetAuthUi());

  const revalidateUser = async () => {
    await queryClient.invalidateQueries({ queryKey: authKeys.user() });
  };

  const syncUserIfReturned = (res: unknown) => {
    const u = extractUserIfAny(res);
    if (!u) return;

    AuthCookies.setUser(u);
    queryClient.setQueryData<User>(authKeys.user(), u);
  };

  const phonesQuery = useQuery({
    queryKey: phoneKeys.list(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PhoneItem[]> => {
      const res = await phoneService.getPhones();

      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to load phones");
      }

      return extractPhoneList(res);
    },
  });

  const usePhoneById = (id: number) =>
    useQuery({
      queryKey: phoneKeys.detail(id),
      enabled: isAuthenticated && Number.isFinite(id) && id > 0,
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<SinglePhoneResponse> => {
        const res = await phoneService.getPhoneById(id);

        if (!res?.success) {
          throw new Error(res?.error || "Failed to load phone");
        }

        if (!res.phone) throw new Error("Phone not found");

        return res;
      },
    });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePhonePayload) =>
      phoneService.createPhone(payload),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: PhoneMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Create phone failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Phone created successfully!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: phoneKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Create phone failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id }: { id: number | string }) =>
      phoneService.verifyPhone(id),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: PhoneMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "OTP sent failed"));
        return;
      }

      dispatch(setSuccess(res.message || "OTP sent successfully!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: phoneKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "OTP sent failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: ({ id, otp }: { id: number | string; otp: number | string }) =>
      phoneService.verifyPhoneOtp(id, otp),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: PhoneMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Verification failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Verification successfull!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: phoneKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Verification failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => phoneService.deletePhone(id),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: PhoneMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Delete phone failed"));
        return;
      }

      if (res?.message) {
        dispatch(setSuccess(res.message || "Phone deleted successfully!"));
      }

      await queryClient.invalidateQueries({ queryKey: phoneKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(setError(getUnknownErrorMessage(err, "Delete phone failed")));
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number | string) => phoneService.setDefaultPhone(id),
    onMutate: () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      dispatch(setSuccess(null));
    },
    onSuccess: async (res: PhoneMutationResponse) => {
      if (res?.error) {
        dispatch(setError(res.error || "Set default phone failed"));
        return;
      }

      dispatch(setSuccess(res.message || "Default phone updated!"));

      syncUserIfReturned(res);
      await queryClient.invalidateQueries({ queryKey: phoneKeys.all });
      await revalidateUser();
    },
    onError: (err: unknown) => {
      dispatch(
        setError(getUnknownErrorMessage(err, "Set default phone failed")),
      );
    },
    onSettled: () => {
      dispatch(setLoading(false));
    },
  });

  const createPhone = useCallback(
    (payload: CreatePhonePayload) => createMutation.mutateAsync(payload),
    [createMutation],
  );

  const verifyPhone = useCallback(
    (id: number | string) => verifyMutation.mutateAsync({ id }),
    [verifyMutation],
  );

  const verifyPhoneOTP = useCallback(
    (id: number | string, otp: number | string) =>
      verifyOTPMutation.mutateAsync({ id, otp }),
    [verifyOTPMutation],
  );

  const deletePhone = useCallback(
    (id: number) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  const setDefaultPhone = useCallback(
    (id: number | string) => setDefaultMutation.mutateAsync(id),
    [setDefaultMutation],
  );

  return {
    // list
    phones: phonesQuery.data ?? [],
    phonesLoading: phonesQuery.isLoading,
    phonesError: phonesQuery.error,

    // detail hook
    usePhoneById,

    // actions
    createPhone,
    verifyPhone,
    verifyPhoneOTP,
    deletePhone,
    setDefaultPhone,

    // ui
    isLoading,
    error,
    success,
    clearUi,

    // mutation states
    isCreating: createMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
  };
};
