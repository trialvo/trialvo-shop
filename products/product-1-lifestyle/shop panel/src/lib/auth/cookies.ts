"use client";

import Cookies from "js-cookie";

import {
  AUTH_COOKIE_KEYS,
  AUTH_OAUTH_STATE_MAX_AGE_SECONDS,
  AUTH_SESSION_DAYS,
  type AuthSession,
} from "./session";

type MarkerOptions = {
  notify?: boolean;
};

export class AuthCookies {
  private static readonly keys = AUTH_COOKIE_KEYS;

  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  private static notify(): void {
    if (!this.isBrowser()) return;
    window.dispatchEvent(new Event("auth:changed"));
  }

  private static cookieOptions() {
    return {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    } as const;
  }

  static setSessionMarker(options: MarkerOptions = {}): void {
    if (!this.isBrowser()) return;

    Cookies.set(this.keys.marker, "1", {
      ...this.cookieOptions(),
      expires: AUTH_SESSION_DAYS,
    });

    if (options.notify !== false) this.notify();
  }

  static setToken(token: string, options: MarkerOptions = {}): void {
    if (!this.isBrowser()) return;

    const cleaned = token.trim();
    if (!cleaned) return;

    Cookies.set(this.keys.access, cleaned, {
      ...this.cookieOptions(),
      expires: AUTH_SESSION_DAYS,
    });

    this.setSessionMarker({ notify: false });
    if (options.notify !== false) this.notify();
  }

  static setUser(user: object, options: MarkerOptions = {}): void {
    if (!this.isBrowser()) return;

    Cookies.set(this.keys.user, JSON.stringify(user), {
      ...this.cookieOptions(),
      expires: AUTH_SESSION_DAYS,
    });

    if (options.notify !== false) this.notify();
  }

  static getUser<T = unknown>(): T | null {
    if (!this.isBrowser()) return null;

    const raw = Cookies.get(this.keys.user);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      this.removeUser();
      return null;
    }
  }

  static removeUser(options: MarkerOptions = {}): void {
    if (!this.isBrowser()) return;

    Cookies.remove(this.keys.user, { path: "/" });
    if (options.notify !== false) this.notify();
  }

  static setSession(session?: Partial<AuthSession> | null): void {
    if (session?.accessToken) {
      this.setToken(session.accessToken, { notify: false });
    }

    if (session?.user) {
      this.setUser(session.user, { notify: false });
    }

    this.setSessionMarker({ notify: false });
    this.notify();
  }

  static getSessionMarker(): string | null {
    if (!this.isBrowser()) return null;

    const marker = Cookies.get(this.keys.marker);
    if (!marker) return null;

    const cleaned = marker.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  static getToken(): string | null {
    if (!this.isBrowser()) return null;

    const token = Cookies.get(this.keys.access);
    if (!token) return null;

    const cleaned = token.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  static removeToken(options: MarkerOptions = {}): void {
    if (!this.isBrowser()) return;
    Cookies.remove(this.keys.access, { path: "/" });
    if (options.notify !== false) this.notify();
  }

  static removeSessionMarker(options: MarkerOptions = {}): void {
    if (!this.isBrowser()) return;

    Cookies.remove(this.keys.marker, { path: "/" });
    if (options.notify !== false) this.notify();
  }

  static setOAuthState(state: string): void {
    if (!this.isBrowser()) return;

    Cookies.set(this.keys.googleOAuthState, state, {
      ...this.cookieOptions(),
      sameSite: "strict",
      expires: AUTH_OAUTH_STATE_MAX_AGE_SECONDS / 86400,
    });
  }

  static removeOAuthState(): void {
    if (!this.isBrowser()) return;
    Cookies.remove(this.keys.googleOAuthState, { path: "/" });
  }

  static clearAll(): void {
    if (!this.isBrowser()) return;

    this.removeSessionMarker({ notify: false });
    Cookies.remove(this.keys.access, { path: "/" });
    Cookies.remove(this.keys.user, { path: "/" });
    Cookies.remove(this.keys.legacyUser, { path: "/" });
    this.removeOAuthState();
    this.notify();
  }

  static clearSession(): void {
    this.clearAll();
  }

  static isAuthenticated(): boolean {
    return !!this.getToken() || !!this.getSessionMarker();
  }
}

export default AuthCookies;
