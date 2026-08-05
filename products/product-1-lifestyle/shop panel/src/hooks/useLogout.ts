"use client";

import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch } from "@/store";
import { logout as logoutAuthState } from "@/store/slices/authSlice";
import { clearCart } from "@/store/slices/cartSlice";
import { clearWishlist } from "@/store/slices/wishlistSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Clean logout: clears cookies, Redux state, React Query cache,
 * and redirects to auth page.
 */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = useCallback(() => {
    void fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
    }).catch(() => undefined);

    AuthCookies.clearAll();

    dispatch(logoutAuthState());
    dispatch(clearCart());
    dispatch(clearWishlist());

    queryClient.clear();

    router.push("/auth");
  }, [dispatch, queryClient, router]);

  return { logout };
};
