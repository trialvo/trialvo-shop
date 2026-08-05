"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  adminStorage,
  clearAuthStorage,
  tokenStorage,
  type StoragePersistOptions,
  type StoredAdmin,
} from "@/lib/storage";
import { getJwtExpMs, getJwtPayload, isTokenExpired } from "@/lib/jwt";
import { AUTH_LOGOUT_EVENT } from "@/api/client";

type AuthContextValue = {
  hydrated: boolean;
  token: string | null;
  admin: StoredAdmin | null;
  isAuthed: boolean;

  setSession: (token: string, admin: StoredAdmin, options?: SessionOptions) => void;
  logout: (reason?: string) => void;

  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
};

type SessionOptions = StoragePersistOptions & {
  notify?: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const clearAllCookies = () => {
  if (typeof document === "undefined") return;
  document.cookie.split(";").forEach((cookie) => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
    document.cookie = `${name.trim()}=;expires=${new Date(0).toUTCString()};path=/`;
  });
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<StoredAdmin | null>(null);

  const buildAdminFromToken = useCallback((t: string): StoredAdmin | null => {
    const payload = getJwtPayload(t);
    if (!payload?.id || !payload.email) return null;
    return {
      id: payload.id,
      email: payload.email,
      first_name: null,
      last_name: null,
      phone: null,
      address: null,
      profile_img_path: null,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  }, []);

  const mergeAdminWithToken = useCallback((t: string, a: StoredAdmin): StoredAdmin => {
    const payload = getJwtPayload(t);
    if (!payload) return a;
    return {
      ...a,
      id: a.id ?? payload.id ?? 0,
      email: a.email ?? payload.email ?? "",
      roles: a.roles?.length ? a.roles : payload.roles ?? [],
      permissions: a.permissions?.length ? a.permissions : payload.permissions ?? [],
    };
  }, []);

  // ✅ hydrate from localStorage (no flashing)
  useEffect(() => {
    const t = tokenStorage.get();
    const a = adminStorage.get();

    if (!t) {
      if (a) clearAuthStorage();
      setToken(null);
      setAdmin(null);
      setHydrated(true);
      return;
    }

    if (isTokenExpired(t)) {
      clearAuthStorage();
      setToken(null);
      setAdmin(null);
      setHydrated(true);
      return;
    }

    const resolvedAdmin = a ? mergeAdminWithToken(t, a) : buildAdminFromToken(t);
    if (!resolvedAdmin?.id || !resolvedAdmin.email) {
      clearAuthStorage();
      setToken(null);
      setAdmin(null);
      setHydrated(true);
      return;
    }

    setToken(t);
    setAdmin(resolvedAdmin);
    setHydrated(true);
  }, [buildAdminFromToken, mergeAdminWithToken]);

  const logout = useCallback(
    (reason?: string) => {
      clearAuthStorage();
      clearAllCookies();
      setToken(null);
      setAdmin(null);
      toast.success(reason ?? "Logged out");
      navigate("/", { replace: true });
    },
    [navigate]
  );

  // ✅ listen for axios 401 interceptor
  useEffect(() => {
    const handler = () => {
      // avoid double toast spam
      clearAuthStorage();
      clearAllCookies();
      setToken(null);
      setAdmin(null);

      // if already on home, no need extra nav
      if (location.pathname !== "/") {
        toast.error("Session expired. Please login again.");
        navigate("/", { replace: true });
      } else {
        toast.error("Session expired. Please login again.");
      }
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, [navigate, location.pathname]);

  // ✅ auto logout on token expiry time (even without API call)
  useEffect(() => {
    if (!token) return;

    const expMs = getJwtExpMs(token);
    if (!expMs) return;

    const msLeft = expMs - Date.now();
    if (msLeft <= 0) {
      logout("Session expired");
      return;
    }

    // 2 seconds earlier logout
    const timer = window.setTimeout(() => {
      logout("Session expired");
    }, Math.max(0, msLeft - 2000));

    return () => window.clearTimeout(timer);
  }, [token, logout]);

  const setSession = useCallback(
    (t: string, a: StoredAdmin, options?: SessionOptions) => {
      const resolvedAdmin = mergeAdminWithToken(t, a);
      tokenStorage.set(t, options);
      adminStorage.set(resolvedAdmin, options);
      setToken(t);
      setAdmin(resolvedAdmin);
      if (options?.notify) {
        toast.success("Signed in successfully");
      }
    },
    [mergeAdminWithToken]
  );

  const hasRole = useCallback((role: string) => Boolean(admin?.roles?.includes(role)), [admin]);
  const hasAnyRole = useCallback((roles: string[]) => roles.some((r) => admin?.roles?.includes(r)), [admin]);
  const hasPermission = useCallback(
    (permission: string) => Boolean(admin?.permissions?.includes(permission)),
    [admin]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      token,
      admin,
      isAuthed: Boolean(token && admin),

      setSession,
      logout,

      hasRole,
      hasAnyRole,
      hasPermission,
    }),
    [hydrated, token, admin, setSession, logout, hasRole, hasAnyRole, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
