import type { User } from "@/lib/api/auth/types";

export const AUTH_COOKIE_KEYS = {
  access: "ecom_access_token",
  marker: "ecom_auth_session",
  user: "ecom_user_data",
  googleOAuthState: "ecom_google_oauth_state",
  legacyUser: "ecom_user_data",
} as const;

export const AUTH_SESSION_DAYS = 7;
export const AUTH_SESSION_SECONDS = AUTH_SESSION_DAYS * 24 * 60 * 60;
export const AUTH_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export const AUTH_ROUTE_PATHS = {
  signIn: "/auth",
  home: "/",
} as const;

export const AUTH_PROTECTED_PREFIXES = [
  "/account",
  "/orders",
  "/wishlist",
  "/settings",
] as const;

export const AUTH_PUBLIC_ONLY_PREFIXES = ["/auth"] as const;

export type AuthSession = {
  accessToken: string;
  user: User;
};

export const isPathWithPrefix = (
  pathname: string,
  prefixes: readonly string[],
) =>
  prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
