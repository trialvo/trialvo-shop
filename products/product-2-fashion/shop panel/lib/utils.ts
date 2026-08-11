import { bdMobileSchema, emailSchema } from "@/lib/auth-schemas";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "./api/auth/service";
import type { ProductDetail } from "./api/product/service";

type PrettyDateOptions = {
  locale?: string;
  timeZone?: string;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type IdentifierType = "email" | "phone";

export const detectEmailOrPhone = (
  raw: string,
): { type: "email"; email: string } | { type: "phone"; phone: string } => {
  const value = raw.trim();

  if (emailSchema.safeParse(value).success) {
    return { type: "email", email: value };
  }

  if (bdMobileSchema.safeParse(value).success) {
    const digits = value.replaceAll(/\D/g, "");
    const normalized = digits.startsWith("88") ? digits.slice(2) : digits;
    return { type: "phone", phone: normalized };
  }

  throw new Error("Enter a valid email or mobile number.");
};

export const maskEmail = (value: string): string => {
  const atIndex = value.indexOf("@");
  if (atIndex <= 0) return value;

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (!domain) return value;

  if (localPart.length <= 2) return value;

  const maskedLocal =
    localPart.charAt(0) + "*".repeat(localPart.length - 2) + localPart.at(-1);

  return `${maskedLocal}@${domain}`;
};

export const maskPhoneNumber = (value: string): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return raw;

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("01")) {
    const head = digits.slice(0, 3);
    const tail = digits.slice(-2);
    return `${head}${"*".repeat(11 - (3 + 2))}${tail}`;
  }

  if (digits.length === 13 && digits.startsWith("8801")) {
    const local = digits.slice(2);
    const head = local.slice(0, 3);
    const tail = local.slice(-2);
    const maskedLocal = `${head}${"*".repeat(11 - (3 + 2))}${tail}`;
    return `+88${maskedLocal}`;
  }

  if (digits.length <= 4) return raw;

  const head = digits.slice(0, 2);
  const tail = digits.slice(-2);
  return `${head}${"*".repeat(digits.length - 4)}${tail}`;
};

export const toDateString = (v: Date | string): string => {
  if (typeof v === "string") return v;
  const yyyy = v.getFullYear();
  const mm = String(v.getMonth() + 1).padStart(2, "0");
  const dd = String(v.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export function formatPrettyDate(
  input: string | Date | null | undefined,
  { locale = "en-US", timeZone }: PrettyDateOptions = {},
): string {
  if (!input) return "";

  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const fmt = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });

  const parts = fmt.formatToParts(d);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const dayStr = parts.find((p) => p.type === "day")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  const day = Number(dayStr);
  if (!month || !year || !day) return "";

  return `${month} ${day}${ordinal(day)}, ${year}`;
}

/** Known API / CDN origins the backend may embed in image URLs. */
const API_ORIGINS = [
  "https://graduatefashionbd.com",
  "https://api.graduatefashionbd.com",
  "https://storage.googleapis.com/graduate-ecom-mumbai-641431966702",
  "https://storage.googleapis.com/graduate-ecom",
  "https://graduatefashion-api-641431966702.asia-south1.run.app",
  "https://graduatefashion-api-641431966702.asia-southeast1.run.app",
  "https://shop-api.shoplinkbd.com",
  "https://shop.shoplinkbd.com",
];

import {
  IMAGE_URL,
  applyShopRuntimeConfig,
} from "@/config/env";

/**
 * Resolve the media base at call time (not module-init).
 * Client bundles bake production GCS as IMAGE_URL; trial containers inject
 * the real base via window.__SHOP_CONFIG__ / process.env.IMAGE_URL.
 */
function resolveImageBase(): string {
  if (typeof window !== "undefined") {
    applyShopRuntimeConfig();
    const cfg = window.__SHOP_CONFIG__;
    if (cfg && "IMAGE_URL" in cfg) {
      return String(cfg.IMAGE_URL ?? "").trim().replace(/\/+$/, "");
    }
  }

  const env = typeof process !== "undefined" ? process.env : undefined;
  if (env?.IMAGE_URL !== undefined && env.IMAGE_URL !== null) {
    return String(env.IMAGE_URL).trim().replace(/\/+$/, "");
  }
  const pub = env?.NEXT_PUBLIC_IMAGE_URL;
  if (pub !== undefined && pub !== null) {
    return String(pub).trim().replace(/\/+$/, "");
  }

  // Never fall back to API_URL — empty IMAGE_URL means same-origin /uploads proxy.
  return (IMAGE_URL || "").trim().replace(/\/+$/, "");
}

/** Strip absolute CDN/API origins down to `/uploads/...` (or other app path). */
function toRelativeMediaPath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    for (const origin of API_ORIGINS) {
      if (trimmed.startsWith(origin)) {
        const relative = trimmed.slice(origin.length);
        return relative.startsWith("/") ? relative : `/${relative}`;
      }
    }

    const cloudRunMatch = trimmed.match(
      /^https?:\/\/[\w-]+\.(?:[\w-]+\.)?run\.app(\/.*)$/i,
    );
    if (cloudRunMatch) return cloudRunMatch[1];

    // Any host that already points at local uploads — keep path only
    const uploadsIdx = trimmed.indexOf("/uploads/");
    if (uploadsIdx >= 0) return trimmed.slice(uploadsIdx);

    // Unknown external URL — keep absolute
    return trimmed;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function toPublicUrl(path?: string | null): string | null {
  if (!path) return null;

  const relativeOrAbsolute = toRelativeMediaPath(path);
  if (!relativeOrAbsolute) return null;

  // External non-upload URL (e.g. Google avatar) — leave untouched
  if (/^https?:\/\//i.test(relativeOrAbsolute)) {
    return relativeOrAbsolute;
  }

  const imageBase = resolveImageBase();

  // No usable base (or baked GCS with no runtime override yet):
  // use same-origin `/uploads/...` so the shop BFF/proxy can serve files.
  if (
    !imageBase ||
    imageBase.includes("storage.googleapis.com")
  ) {
    return relativeOrAbsolute;
  }

  return `${imageBase}${relativeOrAbsolute}`;
}

export function getFirstImage(product: ProductDetail): string {
  const first = product?.images?.[0] as unknown;

  if (first && typeof first === "object" && "path" in first) {
    const p = first.path;
    return typeof p === "string" ? p : "";
  }

  if (typeof first === "string") return first;

  return "";
}

export function getUserDisplayName(user: User | undefined): string {
  const first = (user?.first_name ?? "").trim();
  const last = (user?.last_name ?? "").trim();
  const full = `${first} ${last}`.trim();
  return full || (user?.email ?? "My Account");
}

export function getUserAvatarSrc(user: User | undefined): string | null {
  const p = user?.img_path;
  if (typeof p !== "string") return null;
  const t = p.trim();
  return t ? toPublicUrl(t) : null;
}

export const getDateRange = (rangeTo: number) => {
  const today = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + rangeTo);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    date_from: formatDate(today),
    date_to: formatDate(sevenDaysLater),
  };
};

/**
 * Returns the localised name for an entity.
 * When language is "bn" and name_bd is a non-empty string, returns name_bd.
 * Otherwise always falls back to the English name.
 */
export function getLocalName(
  name: string,
  name_bd: string | null | undefined,
  language: string | null,
): string {
  if (language === "bn") {
    const bd = (name_bd ?? "").trim();
    if (bd.length > 0) return bd;
  }
  return name;
}
