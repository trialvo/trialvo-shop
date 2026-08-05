import { toDashboardWelcome } from "@/lib/adapters/accountDashboard";
import type { Phone, User } from "@/lib/api/auth/service";
import { sanitizeAuthText } from "@/lib/security/auth";

export const ACCOUNT_TAB_IDS = [
  "dashboard",
  "orders",
  "wishlist",
  "addresses",
  "settings",
] as const;

export type AccountTabId = (typeof ACCOUNT_TAB_IDS)[number];

export type AccountNavIconKey =
  | "dashboard"
  | "orders"
  | "wishlist"
  | "addresses"
  | "settings";

export type AccountNavItem = {
  id: AccountTabId;
  label: string;
  href: string;
  icon: AccountNavIconKey;
  /** Show a count badge when the matching count is available */
  countKey?: keyof AccountSidebarCounts;
};

export type AccountSidebarCounts = {
  orders: number | null;
  wishlist: number | null;
  addresses: number | null;
};

export type AccountSidebarViewModel = {
  displayName: string;
  initials: string;
  email: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isFullyVerified: boolean;
  phoneLabel: string | null;
  isPhoneVerified: boolean;
  /** Short status line under the email */
  statusLabel: string;
};

/** Single source of truth for account sidebar + related nav. */
export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/account?tab=dashboard",
    icon: "dashboard",
  },
  {
    id: "orders",
    label: "Orders",
    href: "/account?tab=orders",
    icon: "orders",
    countKey: "orders",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    href: "/account?tab=wishlist",
    icon: "wishlist",
    countKey: "wishlist",
  },
  {
    id: "addresses",
    label: "Addresses",
    href: "/account?tab=addresses",
    icon: "addresses",
    countKey: "addresses",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/account?tab=settings",
    icon: "settings",
  },
] as const;

export function parseAccountTab(
  raw: string | null | undefined,
): AccountTabId {
  if (raw && (ACCOUNT_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as AccountTabId;
  }
  return "dashboard";
}

function resolveDefaultPhone(user: User | null | undefined): Phone | null {
  if (!user) return null;

  if (
    user.default_phone &&
    typeof user.default_phone === "object" &&
    typeof user.default_phone.phone_number === "string"
  ) {
    return user.default_phone;
  }

  const first = user.phones?.[0];
  if (first && typeof first.phone_number === "string") {
    return first;
  }

  return null;
}

/**
 * Auth user → sidebar profile chip (sanitized, display-ready).
 */
export function toAccountSidebarViewModel(
  user: User | null | undefined,
): AccountSidebarViewModel {
  const welcome = toDashboardWelcome(user);
  const phone = resolveDefaultPhone(user);
  const phoneLabel = phone?.phone_number
    ? sanitizeAuthText(phone.phone_number, 20)
    : null;
  const isPhoneVerified = Boolean(phone?.is_verified);

  let statusLabel = "Account";
  if (welcome.isEmailVerified && isPhoneVerified) {
    statusLabel = "Verified account";
  } else if (welcome.isEmailVerified) {
    statusLabel = "Email verified";
  } else if (isPhoneVerified) {
    statusLabel = "Phone verified";
  } else if (user?.is_fully_verified) {
    statusLabel = "Verified member";
  }

  return {
    displayName: welcome.displayName,
    initials: welcome.initials,
    email: welcome.email,
    avatarUrl: welcome.avatarUrl,
    isEmailVerified: welcome.isEmailVerified,
    isFullyVerified: Boolean(user?.is_fully_verified),
    phoneLabel,
    isPhoneVerified,
    statusLabel,
  };
}

export function formatNavCount(value: number | null | undefined): string | null {
  // Hide badge while loading / empty — keeps the nav quiet.
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  if (value > 99) return "99+";
  return String(Math.floor(value));
}
