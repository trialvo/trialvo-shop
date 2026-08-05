import type { User } from "@/lib/api/auth/types";

export type AuthSessionPayload = {
  accessToken: string;
  user: User;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isAuthUser = (value: unknown): value is User => {
  if (!isRecord(value)) return false;

  const id = value.id;
  const email = value.email;

  return (
    typeof id === "number" &&
    typeof email === "string" &&
    email.trim().length > 0
  );
};

const candidatesFromResponse = (value: unknown): unknown[] => {
  if (!isRecord(value)) return [value];

  const candidates: unknown[] = [value];
  if ("data" in value) candidates.push(value.data);

  return candidates;
};

export const extractAuthSessionPayload = (
  value: unknown,
): AuthSessionPayload | null => {
  for (const candidate of candidatesFromResponse(value)) {
    if (!isRecord(candidate)) continue;

    const accessToken = candidate.access_token;
    const user = candidate.user;

    if (typeof accessToken !== "string" || accessToken.trim().length === 0) {
      continue;
    }

    if (!isAuthUser(user)) continue;

    return {
      accessToken: accessToken.trim(),
      user,
    };
  }

  return null;
};

export const extractAuthUser = (value: unknown): User | null => {
  for (const candidate of candidatesFromResponse(value)) {
    if (!isRecord(candidate)) continue;
    if (isAuthUser(candidate)) return candidate;
    if (isAuthUser(candidate.user)) return candidate.user;
  }

  return null;
};

export const stripAccessToken = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripAccessToken);

  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "access_token")
      .map(([key, entryValue]) => [key, stripAccessToken(entryValue)]),
  );
};
