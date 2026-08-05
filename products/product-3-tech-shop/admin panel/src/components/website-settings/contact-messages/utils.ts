// src/components/contact-messages/utils.ts

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  // Example: 24 Jan 2026, 12:41 PM
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatName(firstName: string | null, lastName: string | null): string {
  const a = (firstName ?? "").trim();
  const b = (lastName ?? "").trim();
  if (a && b) return `${a} ${b}`;
  return a || b || "Guest";
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
