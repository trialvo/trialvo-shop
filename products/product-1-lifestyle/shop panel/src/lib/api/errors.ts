import axios, { type AxiosError } from "axios";

export type ApiErrorResponse = {
  flag?: number;
  error?: string;
  message?: string;
};

export const getAxiosErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
): string => {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "Request failed"
  );
};

export const getUnknownErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error))
    return getAxiosErrorMessage(error);
  if (error instanceof Error) return error.message || fallback;
  return fallback;
};
