"use client";

import * as React from "react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearMessages as clearAuthMessages, setLoading } from "@/redux/slices/authSlice";
import { clearMessages as clearUiMessages } from "@/redux/slices/uiSlice";

/**
 * GlobalToastListener
 *
 * Watches BOTH authSlice and uiSlice for error/success messages and
 * forwards them to the Sonner toast system.
 *
 * - authSlice: drives auth-flow toasts (sign-in, sign-up, etc.)
 * - uiSlice:   drives all other toasts (orders, checkout, address, etc.)
 */
const GlobalToastListener: React.FC = () => {
  const dispatch = useAppDispatch();

  // ── auth slice ──────────────────────────────────────────────────────────
  const {
    isLoading: authLoading,
    error: authError,
    success: authSuccess,
  } = useAppSelector((s) => s.auth);

  // ── ui slice ─────────────────────────────────────────────────────────────
  const {
    error: uiError,
    success: uiSuccess,
  } = useAppSelector((s) => s.ui);

  // Loading spinner (auth only)
  const loadingIdRef = React.useRef<string | number | null>(null);

  React.useEffect(() => {
    if (authLoading) {
      if (loadingIdRef.current) return;
      loadingIdRef.current = toast.loading("Please wait...");
      return;
    }

    if (loadingIdRef.current) {
      toast.dismiss(loadingIdRef.current);
      loadingIdRef.current = null;
    }
  }, [authLoading]);

  // Auth error
  React.useEffect(() => {
    if (!authError) return;

    if (loadingIdRef.current) {
      toast.dismiss(loadingIdRef.current);
      loadingIdRef.current = null;
      dispatch(setLoading(false));
    }

    toast.error(authError);
    dispatch(clearAuthMessages());
  }, [dispatch, authError]);

  // Auth success
  React.useEffect(() => {
    if (!authSuccess) return;

    if (loadingIdRef.current) {
      toast.dismiss(loadingIdRef.current);
      loadingIdRef.current = null;
      dispatch(setLoading(false));
    }

    toast.success(authSuccess);
    dispatch(clearAuthMessages());
  }, [dispatch, authSuccess]);

  // UI error  (orders, checkout, address, any non-auth action)
  React.useEffect(() => {
    if (!uiError) return;
    toast.error(uiError);
    dispatch(clearUiMessages());
  }, [dispatch, uiError]);

  // UI success
  React.useEffect(() => {
    if (!uiSuccess) return;
    toast.success(uiSuccess);
    dispatch(clearUiMessages());
  }, [dispatch, uiSuccess]);

  return null;
};

export default GlobalToastListener;
