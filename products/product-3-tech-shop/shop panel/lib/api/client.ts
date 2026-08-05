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

      if (hadToken && typeof window !== "undefined") {
        const isAuthPage = /^\/(account|auth)/i.test(window.location.pathname);
        if (!isAuthPage) {
          window.location.href = "/account";
        }
      }
    }

    return Promise.reject(error);
  },
);
