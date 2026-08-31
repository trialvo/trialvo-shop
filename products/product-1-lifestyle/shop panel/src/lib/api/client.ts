"use client";

import AuthCookies from "@/lib/auth/cookies";
import { AUTH_ROUTE_PATHS } from "@/lib/auth/session";
import axios, { AxiosError } from "axios";

import type { ApiErrorResponse } from "@/lib/api/errors";

export const API_BASE = "/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 45000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = AuthCookies.getToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      const hadSession = AuthCookies.isAuthenticated();
      AuthCookies.clearAll();
      void fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      }).catch(() => undefined);

      // Only redirect to sign-in when the user had an active session
      // (i.e. their token expired mid-session). Don't redirect on login/auth
      // pages where 401 simply means "wrong credentials".
      if (hadSession && typeof window !== "undefined") {
        const isAuthPage = /^\/(auth|sign-in|sign-up|forgot-password|reset-password|verify-identify)/i.test(
          window.location.pathname
        );
        if (!isAuthPage) {
          window.location.href = AUTH_ROUTE_PATHS.signIn;
        }
      }
    }

    return Promise.reject(error);
  },
);
