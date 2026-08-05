export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
};

const EMPTY: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalMs: 0,
  isExpired: true,
};

/**
 * Parses API datetime strings such as "2026-07-18 23:59:59" or ISO values.
 */
export function parseApiDateTime(
  value: string | null | undefined,
): Date | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed)
    ? trimmed.replace(" ", "T")
    : trimmed;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getCountdownParts(
  endAt: string | null | undefined,
  nowMs: number = Date.now(),
): CountdownParts {
  const end = parseApiDateTime(endAt);
  if (!end) return EMPTY;

  const totalMs = end.getTime() - nowMs;
  if (totalMs <= 0) return EMPTY;

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isExpired: false,
  };
}

/** Earliest valid end time among candidates (campaign / product timers). */
export function earliestEndAt(
  ...candidates: Array<string | null | undefined>
): string | null {
  let best: { iso: string; ms: number } | null = null;

  for (const candidate of candidates) {
    const date = parseApiDateTime(candidate);
    if (!date) continue;
    const ms = date.getTime();
    if (!best || ms < best.ms) {
      best = { iso: candidate!.trim(), ms };
    }
  }

  return best?.iso ?? null;
}
