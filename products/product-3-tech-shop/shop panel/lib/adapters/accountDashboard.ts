import type { User } from "@/lib/api/auth/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { isValidPhoneE164, parsePhoneValue } from "@/lib/phone/parse";
import { sanitizeAuthText, sanitizeEmail } from "@/lib/security/auth";

export type DashboardProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type DashboardProfileFieldErrors = Partial<
  Record<keyof DashboardProfileFormValues, string>
>;

export type DashboardStatsViewModel = {
  totalOrders: number;
  wishlistCount: number;
  addressCount: number;
};

export type DashboardWelcomeViewModel = {
  displayName: string;
  initials: string;
  email: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  greeting: string;
};

export type DashboardQuickLink = {
  href: string;
  label: string;
  /** Lucide icon key — mapped in the UI layer */
  icon: "orders" | "wishlist" | "addresses" | "track" | "settings";
};

function resolvePhone(user: User | null | undefined): string {
  if (!user) return "";
  if (typeof user.default_phone === "string") {
    return sanitizeAuthText(user.default_phone, 20);
  }
  if (
    user.default_phone &&
    typeof user.default_phone === "object" &&
    typeof user.default_phone.phone_number === "string"
  ) {
    return sanitizeAuthText(user.default_phone.phone_number, 20);
  }
  const first = user.phones?.[0]?.phone_number;
  return first ? sanitizeAuthText(first, 20) : "";
}

/**
 * Map auth user → dashboard profile form (sanitized).
 */
export function toDashboardProfileForm(
  user: User | null | undefined,
): DashboardProfileFormValues {
  const rawPhone = resolvePhone(user);
  const parsedPhone = parsePhoneValue(rawPhone, "BD");

  return {
    firstName: sanitizeAuthText(user?.first_name ?? "", 80),
    lastName: sanitizeAuthText(user?.last_name ?? "", 80),
    email: sanitizeEmail(user?.email ?? ""),
    // Prefer E.164 for PhoneInput; fall back to raw local digits.
    phone: parsedPhone.e164 || rawPhone,
  };
}

export function displayNameFromUser(user: User | null | undefined): string {
  const first = sanitizeAuthText(user?.first_name ?? "", 80);
  const last = sanitizeAuthText(user?.last_name ?? "", 80);
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || "User";
}

function initialsFromName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const last = parts.at(-1)!;
  return `${parts[0]!.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function timeOfDayGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Welcome header view-model — display-ready, sanitized fields only.
 */
export function toDashboardWelcome(
  user: User | null | undefined,
): DashboardWelcomeViewModel {
  const displayName = displayNameFromUser(user);
  const rawPath =
    typeof user?.img_path === "string" && user.img_path.trim()
      ? user.img_path.trim()
      : null;
  const resolved = rawPath ? resolveMediaUrl(rawPath, "") : null;
  const avatarUrl =
    resolved &&
    resolved !== "/placeholder.jpg" &&
    (/^https?:\/\//i.test(resolved) || resolved.startsWith("/"))
      ? resolved
      : null;

  return {
    displayName,
    initials: initialsFromName(displayName),
    email: sanitizeEmail(user?.email ?? ""),
    avatarUrl,
    isEmailVerified: Boolean(user?.is_email_verified),
    greeting: timeOfDayGreeting(),
  };
}

export const DASHBOARD_QUICK_LINKS: readonly DashboardQuickLink[] = [
  { href: "/account?tab=orders", label: "Orders", icon: "orders" },
  { href: "/account?tab=wishlist", label: "Wishlist", icon: "wishlist" },
  { href: "/account?tab=addresses", label: "Addresses", icon: "addresses" },
  { href: "/order-tracking", label: "Track order", icon: "track" },
] as const;

/** Recent orders slice size on the dashboard (not the full orders tab). */
export const DASHBOARD_RECENT_ORDERS_LIMIT = 5;

/**
 * Field-level validation for inline feedback (standard form UX).
 */
export function getDashboardProfileFieldErrors(
  values: DashboardProfileFormValues,
): DashboardProfileFieldErrors {
  const errors: DashboardProfileFieldErrors = {};

  const first = values.firstName.trim();
  if (first.length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  } else if (first.length > 80) {
    errors.firstName = "First name is too long.";
  }

  const last = values.lastName.trim();
  if (last.length > 80) {
    errors.lastName = "Last name is too long.";
  }

  const email = values.email.trim();
  if (!email || !email.includes("@") || email.length > 254) {
    errors.email = "Enter a valid email address.";
  }

  const phone = values.phone.trim();
  if (phone && !isValidPhoneE164(phone)) {
    errors.phone = "Enter a valid phone number for the selected country.";
  }

  return errors;
}

export function validateDashboardProfile(
  values: DashboardProfileFormValues,
): string | null {
  const errors = getDashboardProfileFieldErrors(values);
  return (
    errors.firstName ??
    errors.lastName ??
    errors.email ??
    errors.phone ??
    null
  );
}

export function isDashboardProfileDirty(
  current: DashboardProfileFormValues,
  initial: DashboardProfileFormValues,
): boolean {
  return (
    current.firstName !== initial.firstName ||
    current.lastName !== initial.lastName ||
    current.email !== initial.email ||
    current.phone !== initial.phone
  );
}

export function profilesEqual(
  a: DashboardProfileFormValues,
  b: DashboardProfileFormValues,
): boolean {
  return !isDashboardProfileDirty(a, b);
}
