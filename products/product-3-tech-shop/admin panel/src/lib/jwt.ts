export type JwtPayload = {
  id?: number;
  email?: string;
  roles?: string[];
  permissions?: string[];
  token_version?: number;
  iat?: number;
  exp?: number; // seconds
};

const decodeBase64Url = (input: string) => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
};

export const getJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
};

export const getJwtExpMs = (token: string): number | null => {
  try {
    const payload = getJwtPayload(token);
    if (!payload) return null;
    if (!payload.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const expMs = getJwtExpMs(token);
  if (!expMs) return false;
  return Date.now() >= expMs;
};
