import type { NextResponse } from "next/server";

import {
  AUTH_COOKIE_KEYS,
  AUTH_OAUTH_STATE_MAX_AGE_SECONDS,
  AUTH_SESSION_SECONDS,
  type AuthSession,
} from "./session";

const secure = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure,
};

export const setAuthSessionCookies = (
  response: NextResponse,
  session: AuthSession,
) => {
  response.cookies.set(AUTH_COOKIE_KEYS.access, session.accessToken, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: AUTH_SESSION_SECONDS,
  });

  response.cookies.set(AUTH_COOKIE_KEYS.marker, "1", {
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: AUTH_SESSION_SECONDS,
  });

  response.cookies.delete(AUTH_COOKIE_KEYS.user);
  response.cookies.delete(AUTH_COOKIE_KEYS.legacyUser);
};

export const clearAuthSessionCookies = (response: NextResponse) => {
  response.cookies.delete(AUTH_COOKIE_KEYS.access);
  response.cookies.delete(AUTH_COOKIE_KEYS.marker);
  response.cookies.delete(AUTH_COOKIE_KEYS.user);
  response.cookies.delete(AUTH_COOKIE_KEYS.legacyUser);
  response.cookies.delete(AUTH_COOKIE_KEYS.googleOAuthState);
};

export const clearGoogleOAuthStateCookie = (response: NextResponse) => {
  response.cookies.delete(AUTH_COOKIE_KEYS.googleOAuthState);
};

export const setGoogleOAuthStateCookie = (
  response: NextResponse,
  state: string,
) => {
  response.cookies.set(AUTH_COOKIE_KEYS.googleOAuthState, state, {
    path: "/",
    sameSite: "strict",
    secure,
    httpOnly: false,
    maxAge: AUTH_OAUTH_STATE_MAX_AGE_SECONDS,
  });
};
