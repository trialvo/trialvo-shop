import type { TimePeriodKey } from "./types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getPeriodRange(period: TimePeriodKey): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "today") {
    // same day
  } else if (period === "last7") {
    start.setDate(start.getDate() - 6);
  } else if (period === "thisMonth") {
    start.setDate(1);
  } else {
    start.setMonth(0, 1);
  }

  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function parseMoney(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatBdt(
  n: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
) {
  const minimumFractionDigits = opts?.minimumFractionDigits ?? 0;
  const maximumFractionDigits = opts?.maximumFractionDigits ?? 0;
  return `${n.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits })} BDT`;
}

export function formatIsoDateTimeToDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return toIsoDate(d);
}
