import type { TimePeriodKey } from "./types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return startOfDay(x);
}

function startOfYear(d: Date) {
  const x = new Date(d.getFullYear(), 0, 1);
  return startOfDay(x);
}

export function startEndByPeriod(period: TimePeriodKey, now: Date = new Date()) {
  const today = startOfDay(now);

  if (period === "today") {
    return { startDate: toIsoDate(today), endDate: toIsoDate(endOfDay(today)) };
  }

  if (period === "last7") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { startDate: toIsoDate(start), endDate: toIsoDate(endOfDay(today)) };
  }

  if (period === "thisMonth") {
    const start = startOfMonth(today);
    return { startDate: toIsoDate(start), endDate: toIsoDate(endOfDay(today)) };
  }

  const start = startOfYear(today);
  return { startDate: toIsoDate(start), endDate: toIsoDate(endOfDay(today)) };
}

export function periodLabel(p: TimePeriodKey) {
  if (p === "today") return "Today";
  if (p === "last7") return "Last 7 Days";
  if (p === "thisMonth") return "This Month";
  return "This Year";
}

export function formatLocalDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
