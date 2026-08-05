"use client";

import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch } from "@/redux/hooks";
import { setError } from "@/redux/slices/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const useLogout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    AuthCookies.clearAll();

    queryClient.clear();

    if (typeof window !== "undefined") {
      // Preserve language preferences across logout
      const savedLang = localStorage.getItem("app_language");
      const savedLangSelected = localStorage.getItem("language_selected");

      localStorage.clear();

      // Restore language state
      if (savedLang) localStorage.setItem("app_language", savedLang);
      if (savedLangSelected) localStorage.setItem("language_selected", savedLangSelected);
    }

    dispatch(setError("You have been logged out successfully!"));

    router?.replace('/sign-in')
    router.refresh();

    requestAnimationFrame(() => {
      router.push("/sign-in");
    });

    return () => {
      // Any cleanup if necessary
    };
  }, [router, dispatch, queryClient]);

  return logout;
};