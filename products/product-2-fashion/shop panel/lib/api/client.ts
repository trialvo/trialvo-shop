"use client";

import AuthCookies from "@/lib/auth/cookies";
import axios, { AxiosError } from "axios";

import type { ApiErrorResponse } from "@/lib/api/errors";

// Same-origin BFF (Lifestyle pattern) — browser never calls Docker-internal API host
export const API_BASE = "/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
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
      const hadToken = !!AuthCookies.getToken();
      AuthCookies.clearAll();

      // Only redirect to sign-in when the user had an active session
      // (i.e. their token expired mid-session). Don't redirect on login/auth
      // pages where 401 simply means "wrong credentials".
      if (hadToken && typeof window !== "undefined") {
        const isAuthPage = /^\/(sign-in|sign-up|forgot-password|reset-password|verify-identify)/i.test(
          window.location.pathname
        );
        if (!isAuthPage) {
          window.location.href = "/sign-in";
        }
      }
    }

    return Promise.reject(error);
  },
);
