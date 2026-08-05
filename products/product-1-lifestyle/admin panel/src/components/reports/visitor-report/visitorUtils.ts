// src/components/reports/visitor-report/visitorUtils.ts
import type { TimePeriodKey } from "./types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getPeriodRange(period: TimePeriodKey) {
  const now = new Date();
  const end = new Date(now);

  if (period === "today") {
    const start = new Date(now);
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }

  if (period === "last7") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }

  if (period === "thisMonth") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }

  // thisYear
  const start = new Date(now.getFullYear(), 0, 1);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function clampPctText(v: string) {
  const s = String(v ?? "").trim();
  if (!s) return "0%";
  if (!s.includes("%")) return `${s}%`;
  return s;
}

export function periodLabel(p: TimePeriodKey) {
  if (p === "today") return "Today";
  if (p === "last7") return "Last 7 Days";
  if (p === "thisMonth") return "This Month";
  return "This Year";
}
