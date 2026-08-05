import type { CompareSlot, CompareSlots } from "@/store/compare/types";
import { COMPARE_STORAGE_KEY } from "@/store/compare/types";

function isValidSlot(value: unknown): value is CompareSlot {
  if (!value || typeof value !== "object") return false;
  const slot = value as Record<string, unknown>;
  return (
    typeof slot.id === "number" &&
    Number.isFinite(slot.id) &&
    slot.id > 0 &&
    typeof slot.name === "string" &&
    typeof slot.slug === "string"
  );
}

/**
 * Load compare slots from localStorage. Always returns a 2-tuple.
 * Invalid / malicious payloads are discarded.
 */
export function loadCompareFromStorage(): CompareSlots {
  if (typeof window === "undefined") return [null, null];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [null, null];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 2) return [null, null];
    return [
      isValidSlot(parsed[0]) ? parsed[0] : null,
      isValidSlot(parsed[1]) ? parsed[1] : null,
    ];
  } catch {
    return [null, null];
  }
}

export function saveCompareToStorage(slots: CompareSlots): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(slots));
  } catch {
    /* quota / private mode */
  }
}
