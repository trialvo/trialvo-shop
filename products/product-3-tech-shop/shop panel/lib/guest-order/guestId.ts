"use client";

/**
 * Guest order session id — stronger entropy than 4-digit codes.
 * Format: go- + 16 hex chars from crypto (≈64 bits), 24h TTL.
 */

const CONFIG = {
  storageKey: "tech_shop_guest_id",
  prefix: "go-",
  /** prefix + 16 hex = length 19 */
  idBodyLength: 16,
  ttlMs: 24 * 60 * 60 * 1000,
} as const;

type StoredGuestId = {
  id: string;
  timestamp: number;
};

function expectedIdLength(): number {
  return CONFIG.prefix.length + CONFIG.idBodyLength;
}

export function isValidGuestId(id: string): boolean {
  if (typeof id !== "string" || !id.startsWith(CONFIG.prefix)) return false;
  if (id.length !== expectedIdLength()) return false;
  const body = id.slice(CONFIG.prefix.length);
  return /^[a-f0-9]+$/i.test(body);
}

function readStored(): StoredGuestId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONFIG.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGuestId;
    if (!isValidGuestId(parsed?.id) || !parsed?.timestamp) {
      localStorage.removeItem(CONFIG.storageKey);
      return null;
    }
    if (Date.now() - parsed.timestamp > CONFIG.ttlMs) {
      localStorage.removeItem(CONFIG.storageKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const data: StoredGuestId = { id, timestamp: Date.now() };
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function generateGuestId(): string {
  const bytes = new Uint8Array(CONFIG.idBodyLength / 2);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${CONFIG.prefix}${hex}`;
}

/** Sync helpers for non-React call sites (cart drawer, place order). */
export function getGuestIdFromStorage(): string | null {
  return readStored()?.id ?? null;
}

export function clearGuestIdStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONFIG.storageKey);
  } catch {
    /* ignore */
  }
}

/** Reuse valid stored id; only mint a new one when missing/expired. */
export function ensureGuestId(): string {
  const existing = readStored();
  if (existing) return existing.id;
  const id = generateGuestId();
  writeStored(id);
  return id;
}

export { generateGuestId, readStored as readGuestIdStored };
