import { IMAGE_URL } from "@/config/env";
import type { User } from "@/lib/api/auth/types";

export type HeaderUser = {
  displayName: string;
  firstName: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
};

const cleanString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

export const getAuthAvatarUrl = (path: string | null | undefined): string | null => {
  const value = cleanString(path);
  if (!value) return null;

  if (value.startsWith("/")) {
    return `${IMAGE_URL.replace(/\/+$/, "")}${value}`;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return `${IMAGE_URL.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
  }
};

const getInitials = (displayName: string, email: string): string => {
  const source = displayName || email;
  const initials = source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "?";
};

export const toHeaderUser = (user: User | null | undefined): HeaderUser | null => {
  if (!user) return null;

  const firstName = cleanString(user.first_name);
  const lastName = cleanString(user.last_name);
  const email = cleanString(user.email);
  const emailName = email.split("@")[0] || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || emailName || email;
  const shortName = firstName || displayName.split(/\s+/)[0] || "Account";

  return {
    displayName,
    firstName: shortName,
    email,
    avatarUrl: getAuthAvatarUrl(user.img_path),
    initials: getInitials(displayName, email),
  };
};
