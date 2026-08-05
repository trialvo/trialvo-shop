"use client";

import Cookies from "js-cookie";

const TWO_YEARS = 365 * 2;

export class AuthCookies {
  private static readonly keys = {
    access: "ecom_access_token",
    user: "ecom_user_data",
  };

  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  private static notify(): void {
    if (!this.isBrowser()) return;
    window.dispatchEvent(new Event("auth:changed"));
  }

  static setToken(token: string): void {
    Cookies.set(this.keys.access, token, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: TWO_YEARS,
      path: "/",
    });
    this.notify();
  }

  static getToken(): string | null {
    if (!this.isBrowser()) return null;

    const token = Cookies.get(this.keys.access);
    if (!token) return null;

    const cleaned = token.trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  static removeToken(): void {
    if (!this.isBrowser()) return;
    Cookies.remove(this.keys.access, { path: "/" });
    this.notify();
  }

  static setUser(user: object): void {
    if (!this.isBrowser()) return;

    Cookies.set(this.keys.user, JSON.stringify(user), {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    this.notify();
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

  static removeUser(): void {
    if (!this.isBrowser()) return;
    Cookies.remove(this.keys.user, { path: "/" });
    this.notify();
  }

  static clearAll(): void {
    this.removeToken();
    this.removeUser();
    this.notify();
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default AuthCookies;
