import { API_BASE_URL } from "@/config/env";
import { clearAuthStorage, tokenStorage } from "@/lib/storage";
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

export const AUTH_LOGOUT_EVENT = "auth:logout";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => {
    const data = res?.data as Record<string, unknown> | undefined;
    const rawFlag = data?.flag;
    const hasFlag = rawFlag !== undefined && rawFlag !== null;
    const flag = Number(rawFlag);

    if (hasFlag && Number.isFinite(flag) && flag !== 200) {
      const message =
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.message === "string" && data.message) ||
        `Request failed (flag: ${flag})`;
      const error = new Error(message) as Error & {
        response?: { status?: number; data?: unknown };
      };
      error.response = {
        status: flag,
        data,
      };
      return Promise.reject(error);
    }

    return res;
  },
  (err: AxiosError) => {
    const status = err?.response?.status;
    if (status === 401) {
      clearAuthStorage();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      }
    }
    return Promise.reject(err);
  }
);
