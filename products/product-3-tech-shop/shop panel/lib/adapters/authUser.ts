import type { User } from "@/lib/api/auth/service";
import { resolveMediaUrl } from "@/lib/media/url";
import { sanitizeAuthText, sanitizeEmail } from "@/lib/security/auth";

/**
 * Safe, presentation-ready account fields for header / menus.
 * Never render raw API strings without going through this adapter.
 */
export type HeaderAccountViewModel = {
  id: number;
  displayName: string;
  firstName: string;
  email: string;
  initials: string;
  /** Absolute https image URL, or null when missing/unsafe */
  avatarUrl: string | null;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Runtime guard for cookie / API payloads before trusting as User.
 * Rejects incomplete or tampered cookie blobs.
 */
export function parseAuthUser(raw: unknown): User | null {
  if (!isPlainObject(raw)) return null;

  const id = raw.id;
  const email = raw.email;
  if (typeof id !== "number" || !Number.isFinite(id) || id <= 0) return null;
  if (typeof email !== "string" || email.length === 0 || email.length > 254) {
    return null;
  }

  const first_name =
    typeof raw.first_name === "string" ? raw.first_name : "";
  const last_name = typeof raw.last_name === "string" ? raw.last_name : "";

  let img_path: string | null = null;
  if (raw.img_path === null) {
    img_path = null;
  } else if (typeof raw.img_path === "string") {
    img_path = raw.img_path;
  }

  return {
    id,
    email,
    first_name,
    last_name,
    img_path,
    status:
      raw.status === "active" ||
      raw.status === "inactive" ||
      raw.status === "suspended" ||
      raw.status === "pending"
        ? raw.status
        : "pending",
    has_password: Boolean(raw.has_password),
    gender:
      raw.gender === "male" ||
      raw.gender === "female" ||
      raw.gender === "other" ||
      raw.gender === "unspecified"
        ? raw.gender
        : "unspecified",
    dob: typeof raw.dob === "string" ? raw.dob : null,
    is_email_verified: Boolean(raw.is_email_verified),
    is_fully_verified: Boolean(raw.is_fully_verified),
    total_spent:
      typeof raw.total_spent === "number" && Number.isFinite(raw.total_spent)
        ? raw.total_spent
        : 0,
    default_phone: null,
    phones: [],
    default_address: null,
    addresses: [],
  };
}

function resolveSafeAvatarUrl(imgPath: string | null): string | null {
  if (!imgPath) return null;
  const url = resolveMediaUrl(imgPath, "");
  if (!url || url === "/placeholder.jpg") return null;
  // Only allow http(s) after resolve — blocks leftover schemes
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return null;
  return url;
}

export function toHeaderAccountViewModel(user: User): HeaderAccountViewModel {
  const firstName = sanitizeAuthText(user.first_name ?? "", 40);
  const lastName = sanitizeAuthText(user.last_name ?? "", 40);
  const email = sanitizeEmail(user.email ?? "");

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "Account";

  const initialSource = firstName || lastName || email || "U";
  const initials = initialSource.charAt(0).toUpperCase();

  return {
    id: user.id,
    displayName,
    firstName: firstName || "Account",
    email,
    initials,
    avatarUrl: resolveSafeAvatarUrl(user.img_path),
  };
}
