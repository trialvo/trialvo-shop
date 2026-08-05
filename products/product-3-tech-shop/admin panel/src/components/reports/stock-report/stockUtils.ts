// src/components/reports/stock-report/stockUtils.ts

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

export function clampValidTrendYear(year: number) {
  // based on your API rule: valid year between 2024 and 2027
  if (Number.isNaN(year)) return 2024;
  if (year < 2024) return 2024;
  if (year > 2027) return 2027;
  return year;
}

export function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
