const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function removeToken(): void {
  localStorage.removeItem("auth_token");
}

/**
 * Decode JWT payload without verification (client-side expiry check only).
 * Returns the expiry timestamp in ms, or null if token is invalid/missing.
 */
export function getTokenExpiry(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Check if the stored token is expired (client-side, no API call).
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() >= expiry;
}

/**
 * Trigger auto-logout by clearing the token and dispatching a custom event.
 * AuthContext listens for this event to perform cleanup and redirect.
 */
function triggerAuthExpired(): void {
  removeToken();
  window.dispatchEvent(new CustomEvent("auth:expired"));
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  // Proactive client-side check: don't even make the request if token is expired
  // (skip for login/public endpoints)
  if (token && isTokenExpired() && !endpoint.startsWith("/auth/login")) {
    triggerAuthExpired();
    throw new Error("Session expired. Please log in again.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));

    // Auto-logout on 401 — token expired or invalid
    if (res.status === 401 && !endpoint.startsWith("/auth/login")) {
      triggerAuthExpired();
      throw new Error(body.error || "Session expired. Please log in again.");
    }

    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
