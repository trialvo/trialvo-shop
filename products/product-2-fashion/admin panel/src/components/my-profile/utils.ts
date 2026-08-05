import type { AdminProfileApiResponse } from "@/api/admin-profile.api";
import { toMediaUrl } from "@/api/admin-profile.api";
import type { ProfileUser, UserRole } from "./types";

export function formatNow(): string {
  const d = new Date();
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

function mapRole(roles: string[]): UserRole {
  const r = roles?.[0] || "";
  if (r === "SUPER_ADMIN") return "Super Admin";
  if (r === "MANAGER") return "Manager";
  return "Admin";
}

export function mapAdminProfileToUi(p: AdminProfileApiResponse): ProfileUser {
  return {
    id: p.id,
    email: p.email,

    firstName: p.first_name || "",
    lastName: p.last_name || "",
    phone: p.phone || "",
    address: p.address || "",

    role: mapRole(p.roles || []),
    status: p.is_active ? "active" : "inactive",

    avatarUrl: toMediaUrl(p.profile_img_path),

    createdAt: p.created_at ?? null,
    lastLoginAt: p.last_login_at ?? null,
    lastVisitAt: p.last_login_at ? formatDateTime(p.last_login_at) : "",
  };
}
