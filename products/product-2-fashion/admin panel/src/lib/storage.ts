// src/lib/storage.ts

export type StoragePersistOptions = {
  persist?: boolean; // true => localStorage, false => session-cookie
};

export type StoredAdmin = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  profile_img_path?: string | null;
  roles: string[];
  permissions: string[];
};

const TOKEN_KEY = "auth:token";
const ADMIN_KEY = "auth:admin";

/** ---------- Cookie helpers (session cookie when no expires) ---------- */
function setCookie(key: string, value: string, options?: { days?: number }) {
  if (typeof document === "undefined") return;

  const encoded = encodeURIComponent(value);
  const base = `${key}=${encoded};path=/;SameSite=Lax`;

  // persist cookie if days provided
  if (options?.days && Number.isFinite(options.days)) {
    const expires = new Date(Date.now() + options.days * 24 * 60 * 60 * 1000);
    document.cookie = `${base};expires=${expires.toUTCString()}`;
    return;
  }

  // session cookie (removed when browser closes)
  document.cookie = base;
}

function getCookie(key: string): string | null {
  if (typeof document === "undefined") return null;
  const name = `${key}=`;
  const parts = document.cookie.split(";").map((x) => x.trim());
  const found = parts.find((x) => x.startsWith(name));
  if (!found) return null;
  const raw = found.slice(name.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function removeCookie(key: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=;expires=${new Date(
    0
  ).toUTCString()};path=/;SameSite=Lax`;
}

/** ---------- JSON safe helpers ---------- */
function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * ✅ tokenStorage behavior:
 * - persist:true  => localStorage (survive browser restart)
 * - persist:false => session cookie (share across tabs, removed on browser close)
 *
 * Backward compatible:
 * - get() also checks old sessionStorage/localStorage.
 */
export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;

    // 1) preferred: localStorage
    const ls = window.localStorage.getItem(TOKEN_KEY);
    if (ls) return ls;

    // 2) session cookie (for non-persist)
    const ck = getCookie(TOKEN_KEY);
    if (ck) return ck;

    // 3) fallback: old sessionStorage
    const ss = window.sessionStorage.getItem(TOKEN_KEY);
    if (ss) return ss;

    return null;
  },

  set(token: string, options?: StoragePersistOptions) {
    if (typeof window === "undefined") return;

    const persist = Boolean(options?.persist);

    // ✅ always clear old places first (avoid conflicts)
    window.sessionStorage.removeItem(TOKEN_KEY);
    removeCookie(TOKEN_KEY);

    if (persist) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      // session cookie shared across tabs, cleared on browser close
      window.localStorage.removeItem(TOKEN_KEY);
      setCookie(TOKEN_KEY, token);
    }
  },

  remove() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    removeCookie(TOKEN_KEY);
  },
};

export const adminStorage = {
  get(): StoredAdmin | null {
    if (typeof window === "undefined") return null;

    // 1) localStorage
    const ls = window.localStorage.getItem(ADMIN_KEY);
    const parsedLs = safeParse<StoredAdmin>(ls);
    if (parsedLs) return parsedLs;

    // 2) session cookie
    const ck = getCookie(ADMIN_KEY);
    const parsedCk = safeParse<StoredAdmin>(ck);
    if (parsedCk) return parsedCk;

    // 3) fallback sessionStorage
    const ss = window.sessionStorage.getItem(ADMIN_KEY);
    const parsedSs = safeParse<StoredAdmin>(ss);
    if (parsedSs) return parsedSs;

    return null;
  },

  set(admin: StoredAdmin, options?: StoragePersistOptions) {
    if (typeof window === "undefined") return;

    const persist = Boolean(options?.persist);
    const raw = safeStringify(admin);

    // ✅ clear old places first
    window.sessionStorage.removeItem(ADMIN_KEY);
    removeCookie(ADMIN_KEY);

    if (persist) {
      window.localStorage.setItem(ADMIN_KEY, raw);
    } else {
      window.localStorage.removeItem(ADMIN_KEY);
      // session cookie for cross-tab auth
      setCookie(ADMIN_KEY, raw);
    }
  },

  remove() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ADMIN_KEY);
    window.sessionStorage.removeItem(ADMIN_KEY);
    removeCookie(ADMIN_KEY);
  },
};

export function clearAuthStorage() {
  tokenStorage.remove();
  adminStorage.remove();
}
